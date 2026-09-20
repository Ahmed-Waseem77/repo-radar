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

// A curated palette (client-supplied) instead of a synthesized hue: 4 hue families
// (teal, purple, olive, magenta) each contributing a bright shade (for dark
// backgrounds) and a darker shade (for light backgrounds), taken across two
// brightness "rounds" per family. Ordered so consecutive indices cycle through a
// different hue family before repeating one - the first 4 items shown are always 4
// distinct hues, and items 5-8 reuse those hues at a different brightness rather
// than repeating a hue back-to-back. Each family's darkest, near-black shade is left
// out here - too low-contrast for a filled bar segment against either background.
const CURATED_COLOR_PALETTE: { light: string; dark: string }[] = [
    { dark: '#3DDDB5', light: '#2B7C65' }, // teal, round 1
    { dark: '#703DDD', light: '#4D2B7C' }, // purple, round 1
    { dark: '#C0DD3D', light: '#657C2B' }, // olive, round 1
    { dark: '#DD3DA5', light: '#7C2B64' }, // magenta, round 1
    { dark: '#38B38A', light: '#1D5547' }, // teal, round 2
    { dark: '#5B38B3', light: '#361D55' }, // purple, round 2
    { dark: '#90B338', light: '#45551D' }, // olive, round 2
    { dark: '#B33882', light: '#551D3A' }, // magenta, round 2
]

// Assigns a color by POSITION rather than by hashing the seed - this is what
// actually avoids items colliding on the same color, since hashing alone guarantees
// collisions once there are more items than distinct hues. `seed` only comes into
// play once `index` runs past the curated palette, cycling back through the same
// palette (by hash) instead of falling back to an arbitrary/narrower set.
export function indexedColor(seed: string, index: number): { light: string; dark: string } {
    if (seed.length === 0) return { light: '#9e9e9e', dark: '#9e9e9e' }
    const paletteIndex = index < CURATED_COLOR_PALETTE.length ? index : hashString(seed) % CURATED_COLOR_PALETTE.length
    return CURATED_COLOR_PALETTE[paletteIndex]
}
