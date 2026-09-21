import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import HourglassTopTwoToneIcon from '@mui/icons-material/HourglassTopTwoTone'
import HourglassBottomTwoToneIcon from '@mui/icons-material/HourglassBottomTwoTone'
import type { SvgIconProps } from '@mui/material'

// one full bob+rotate cycle - the icon-swap timer below is kept at half this, so the icon
// visually flips from "sand on top" to "sand on bottom" right as the rotation crosses upside-down
const CYCLE_MS = 1600

// A generic animated loading indicator - reads as an hourglass being continually turned over,
// rather than a plain spinner. Both TwoTone variants stay permanently mounted and toggled by
// opacity, rather than swapping which one renders: swapping the rendered component would remount
// the icon and restart its CSS animation from 0% every half cycle (a visible stutter), since a
// different component type forces React to tear down and recreate the DOM node.
//
// The first icon renders normally, in flow - its own size (governed by whatever `fontSize`/`sx`
// this component is given) is what the wrapping span, and therefore the whole rotating unit,
// sizes itself to. The second is pinned exactly on top of it via inset:0. `lineHeight: 0` on the
// wrapper matters here: without it, the span's effective box (what `transform-origin` measures
// against) can end up taller than the icon itself, inflated by the surrounding text's
// line-height - rotating that taller box around ITS center swings the visibly-smaller icon
// off-axis instead of spinning it in place.
export function HourglassIcon({ sx, ...props }: SvgIconProps) {
    const [flipped, setFlipped] = useState(false)

    useEffect(() => {
        const id = setInterval(() => setFlipped((current) => !current), CYCLE_MS / 2)
        return () => clearInterval(id)
    }, [])

    return (
        <Box
            component="span"
            sx={[
                (theme) => ({
                    position: 'relative',
                    display: 'inline-block',
                    lineHeight: 0,
                    transformOrigin: 'center',
                    '@keyframes hourglass-bob-flip': {
                        '0%': { transform: 'translateY(10%) rotate(0deg)' },
                        '50%': { transform: 'translateY(0) rotate(180deg)' },
                        '100%': { transform: 'translateY(10%) rotate(360deg)' },
                    },
                    animation: `hourglass-bob-flip ${CYCLE_MS}ms ${theme.transitions.easing.easeInOut} infinite`,
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <HourglassTopTwoToneIcon {...props} sx={{ display: 'block', opacity: flipped ? 0 : 1 }} />
            <HourglassBottomTwoToneIcon {...props} sx={{ position: 'absolute', inset: 0, opacity: flipped ? 1 : 0 }} />
        </Box>
    )
}
