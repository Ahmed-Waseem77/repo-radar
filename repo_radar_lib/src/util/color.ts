import type { Theme } from '@mui/material'

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

// Candidate colors are the theme's own semantic palette entries rather than a
// synthesized hue - every color handed out is therefore already part of the app's
// palette (and already has a deliberate dark/light shade per scheme), instead of an
// arbitrary HSL value that might clash or fail contrast.
const paletteKeys = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const

// Deterministically maps a seed string to one of the theme's palette colors, resolved
// per scheme: the light scheme gets that color's `dark` shade (for contrast against a
// light background), the dark scheme gets its `light` shade (for contrast against a
// dark background) - the same shade-swap used elsewhere in this codebase (e.g. InlineCode).
export function themedRandomColor(theme: Theme, seed: string) {
    if (seed.length === 0) return { light: '#9e9e9e', dark: '#9e9e9e' }
    const key = paletteKeys[hashString(seed) % paletteKeys.length]
    return {
        light: theme.colorSchemes?.light?.palette?.[key]?.dark ?? '#9e9e9e',
        dark: theme.colorSchemes?.dark?.palette?.[key]?.light ?? '#9e9e9e',
    }
}
