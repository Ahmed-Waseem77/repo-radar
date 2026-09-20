// Mixes a string's char codes into a well-distributed 32-bit hash.
// Raw char codes cluster tightly - letters sit around 65-122 out of 0-255 - so
// reading them straight into an index leaves the low end of that range picked far
// more often than the high end. XORing each char in and multiplying by a large prime
// scrambles that narrow input across the full bit range instead. This also means
// short strings (e.g. the language "C") no longer need special-casing: every
// character, even just one, still produces a fully mixed 32-bit hash.
export function hashString(s: string): number {
    let hash = 0x811c9dc5 // FNV-1a offset basis
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) // FNV-1a prime
    }
    return hash >>> 0
}

// The client-supplied palette - not used for direct assignment anymore (that produced
// collisions once there were more languages than swatches), but as the "does this look like it
// belongs" reference set below: every hue AND brightness the theme's own accent colors span,
// including the near-black shades that were too low-contrast to paint a bar segment with but
// are still valid luminance targets to steer a generated color toward.
const REFERENCE_COLORS = [
    '#3DDDB5', '#703DDD', '#C0DD3D', '#DD3DA5',
    '#081E17', '#11081E', '#151E08', '#1D5547', '#1E0818',
    '#2B7C65', '#361D55', '#38B38A', '#45551D', '#4D2B7C',
    '#551D3A', '#5B38B3', '#657C2B', '#7C2B64', '#90B338', '#B33882',
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = hex.replace('#', '')
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    }
}

function hslToHex(h: number, s: number, l: number): string {
    const sNorm = s / 100
    const lNorm = l / 100
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = lNorm - c / 2
    let r: number, g: number, b: number
    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// WCAG 2.x relative luminance - https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex)
    const [rs, gs, bs] = [r, g, b].map((channel) => {
        const s = channel / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(hexA: string, hexB: string): number {
    const lA = relativeLuminance(hexA)
    const lB = relativeLuminance(hexB)
    const lighter = Math.max(lA, lB)
    const darker = Math.min(lA, lB)
    return (lighter + 0.05) / (darker + 0.05)
}

// the lowest contrast ratio this color has against ANY reference swatch - i.e. how close it
// gets to matching at least one of them. A ratio of 1 means identical luminance to that swatch.
function bestReferenceMatch(hex: string): number {
    return Math.min(...REFERENCE_COLORS.map((reference) => contrastRatio(hex, reference)))
}

const MAX_ITERATIONS = 9
const LIGHTNESS_STEP = 6 // percentage points nudged per iteration
const APPROXIMATELY_ONE = 1.1 // "close enough" contrast ratio to stop early on

// Starting from a hash-derived hue at the given starting lightness, nudges lightness up or
// down (whichever direction lowers the contrast ratio against the closest reference swatch)
// for up to MAX_ITERATIONS steps, or until that ratio is approximately 1 - i.e. the generated
// color's brightness has converged on matching one already in the theme's own palette, instead
// of sitting at whatever arbitrary brightness the hash happened to produce.
function convergeOnReference(hue: number, saturation: number, startLightness: number): string {
    let lightness = startLightness
    let color = hslToHex(hue, saturation, lightness)
    let ratio = bestReferenceMatch(color)

    for (let i = 0; i < MAX_ITERATIONS && ratio > APPROXIMATELY_ONE; i++) {
        const lighter = Math.min(95, lightness + LIGHTNESS_STEP)
        const darker = Math.max(5, lightness - LIGHTNESS_STEP)
        const lighterColor = hslToHex(hue, saturation, lighter)
        const darkerColor = hslToHex(hue, saturation, darker)
        const lighterRatio = bestReferenceMatch(lighterColor)
        const darkerRatio = bestReferenceMatch(darkerColor)

        if (lighterRatio <= darkerRatio && lighterRatio < ratio) {
            lightness = lighter
            color = lighterColor
            ratio = lighterRatio
        } else if (darkerRatio < ratio) {
            lightness = darker
            color = darkerColor
            ratio = darkerRatio
        } else {
            break // neither direction improves the match - further steps won't help
        }
    }

    return color
}

// Idempotent (same seed always produces the same color) unique-per-language color, hashed from
// the seed rather than assigned by position - this is what actually gives every language its
// own persistent identity across the whole app rather than one tied to wherever it happens to
// rank in a given bar. A raw hash-derived hue tends to land somewhere far more vivid/saturated
// than the theme's own accent colors though, which is what made an earlier hash-based attempt
// here look out of place - convergeOnReference pulls its brightness back toward whatever's
// closest in REFERENCE_COLORS instead of leaving it at that arbitrary starting point.
export function hashedThemeColor(seed: string): { light: string; dark: string } {
    if (seed.length === 0) return { light: '#9e9e9e', dark: '#9e9e9e' }
    const hue = hashString(seed) % 360
    const saturation = 50
    return {
        // light scheme needs a darker tone for contrast against a light background
        light: convergeOnReference(hue, saturation, 30),
        // dark scheme needs a lighter tone for contrast against a near-black background
        dark: convergeOnReference(hue, saturation, 65),
    }
}
