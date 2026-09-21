import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import type { BoxProps } from '@mui/material'
import { Lottie } from 'lottie-react'
import type { LottieHandle } from 'lottie-react'
import repoRadarLogoAnimation from '../../assets/REPO_RADAR_LOGO_LOTTIE.json'
import { LogoStaticIcon } from './LogoStaticIcon'

export interface LogoIconProps extends BoxProps {
    // bump this (e.g. an incrementing counter) to trigger the animation programmatically,
    // independent of hover - undefined (the default) means hover is the only trigger. Left
    // undefined on mount is deliberate: a defined value from the very first render would fire
    // the animation immediately on page load, which callers driving this from a timer don't want.
    playSignal?: number
}

// Resting state is the hand-traced static mark above. On hover (or when `playSignal` changes)
// it cross-fades into the original SVGator animation (src/assets/REPO_RADAR_LOGO_LOTTIE.json),
// played once via lottie-react, then settles back to static. The Lottie file's shapes are baked
// as solid black fills - `& path { fill: currentColor }` overrides that with a plain CSS rule,
// which always outranks an SVG presentation attribute, so the animated mark still recolors per theme.
export function LogoIcon({ sx, playSignal, ...props }: LogoIconProps) {
    const [isHovering, setIsHovering] = useState(false)
    // the playSignal value the animation has already finished settling from - comparing it to
    // the current playSignal below derives "currently animating because of playSignal" at
    // render time, rather than setting that as its own effect-driven state (which would trip
    // react-hooks/set-state-in-effect - see useGetRepo/useSearchRepo for the same pattern).
    // Initialized to the incoming playSignal so a defined value on the very first render
    // doesn't read as "changed" and fire the animation immediately on mount.
    const [settledSignal, setSettledSignal] = useState(playSignal)
    const lottieRef = useRef<LottieHandle>(null)

    const isSignalAnimating = playSignal !== undefined && playSignal !== settledSignal
    const isAnimating = isHovering || isSignalAnimating

    useEffect(() => {
        if (isSignalAnimating) {
            lottieRef.current?.play()
        }
    }, [isSignalAnimating])

    return (
        <Box
            onMouseEnter={() => {
                setIsHovering(true)
                lottieRef.current?.play()
            }}
            onMouseLeave={() => {
                setIsHovering(false)
                lottieRef.current?.stop()
            }}
            {...props}
            sx={[
                { position: 'relative', width: 32, height: 32, display: 'inline-block', flexShrink: 0 },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <Box
                sx={(theme) => ({
                    position: 'absolute',
                    inset: 0,
                    opacity: isAnimating ? 0 : 1,
                    transition: theme.transitions.create('opacity'),
                })}
            >
                <LogoStaticIcon sx={{ width: '100%', height: '100%' }} />
            </Box>
            <Box
                sx={(theme) => ({
                    position: 'absolute',
                    inset: 0,
                    opacity: isAnimating ? 1 : 0,
                    transition: theme.transitions.create('opacity'),
                    pointerEvents: 'none',
                    '& path': { fill: 'currentColor' },
                })}
            >
                <Lottie
                    src={repoRadarLogoAnimation}
                    loop={false}
                    autoplay={false}
                    lottieRef={lottieRef}
                    subscriptions={{
                        complete: () => {
                            setIsHovering(false)
                            setSettledSignal(playSignal)
                        },
                    }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Box>
        </Box>
    )
}
