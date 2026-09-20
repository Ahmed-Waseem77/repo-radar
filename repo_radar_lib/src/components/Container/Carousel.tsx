import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Box, Stack } from '@mui/material'

export interface CarouselProps {
    children: ReactNode
    // gap between items - same unit Stack's own `spacing` prop uses
    spacing?: number
    // horizontal padding on the scroll track itself, in theme spacing units
    gutter?: number
    // width (px) of each edge's fade-to-background overlay
    edgeFadeWidth?: number
    // set false to disable the automatic scrolling entirely (still scrollable by the user)
    autoScroll?: boolean
    // ms to wait after mount before auto-scrolling starts
    autoScrollDelay?: number
    // px advanced per tick once it starts - together with tickMs this sets the scroll speed
    autoScrollStep?: number
    tickMs?: number
}

const DEFAULT_EDGE_FADE_WIDTH = 56

// one fade-to-background overlay, reused for both edges (mirrored via `side`) instead of two
// near-identical Boxes - an inset box-shadow on the scroll track itself would paint BEHIND its
// children, which are typically fully opaque (cards, pills, borders), so they'd hide it
// entirely; this paints on top instead, as a sibling positioned over each edge.
//
// zIndex needs to be explicit and higher than any interactive content inside the track (e.g.
// RepoOverviewCompact lifts its title/commit-hash links and Track button to zIndex:1 so they
// win hit-testing over its own internal "view details" overlay button). The scroll track
// (Stack) isn't itself positioned, so those descendants are promoted straight into THIS
// stacking context and painted by z-index like any other child here - without an explicit,
// higher zIndex the fade (z-index:auto) would sit BEHIND them instead of over them.
// pointerEvents:none keeps that purely visual, not blocking clicks on what's underneath.
function EdgeFade({ side, width }: { side: 'left' | 'right'; width: number }) {
    return (
        <Box
            aria-hidden
            sx={(theme) => ({
                position: 'absolute',
                top: 0,
                bottom: 0,
                [side]: 0,
                width,
                zIndex: 2,
                pointerEvents: 'none',
                background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${theme.vars?.palette.background.default ?? theme.palette.background.default}, transparent)`,
            })}
        />
    )
}

// A horizontally-scrolling row with fade-to-background edges, matching what App.tsx built
// inline for its "Trending Repos" row (see that component's history) - generalized here so any
// row of content can reuse it instead of re-implementing the edge-fade/scroll-track pattern.
//
// After mount, it waits `autoScrollDelay` and then advances `autoScrollStep`px every `tickMs`
// on its own; reaching either end reverses direction instead of snapping back to the start, so
// it bounces back and forth rather than jumping. Hovering pauses it (a paused ref, not state,
// so hovering doesn't tear down/restart the interval or reset the initial delay) - useful since
// carousel items are often clickable themselves.
export default function Carousel({
    children,
    spacing = 2,
    gutter = 0,
    edgeFadeWidth = DEFAULT_EDGE_FADE_WIDTH,
    autoScroll = true,
    autoScrollDelay = 2000,
    autoScrollStep = 1,
    tickMs = 30,
}: CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const pausedRef = useRef(false)

    useEffect(() => {
        if (!autoScroll) return
        const el = scrollRef.current
        if (!el) return

        let intervalId: ReturnType<typeof setInterval> | undefined
        let direction: 1 | -1 = 1

        const timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                if (pausedRef.current) return
                if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
                    direction = -1
                } else if (el.scrollLeft <= 0) {
                    direction = 1
                }
                el.scrollLeft += direction * autoScrollStep
            }, tickMs)
        }, autoScrollDelay)

        return () => {
            clearTimeout(timeoutId)
            clearInterval(intervalId)
        }
    }, [autoScroll, autoScrollDelay, autoScrollStep, tickMs])

    return (
        <Box
            sx={{ position: 'relative' }}
            onMouseEnter={() => { pausedRef.current = true }}
            onMouseLeave={() => { pausedRef.current = false }}
        >
            <Stack
                ref={scrollRef}
                direction="row"
                spacing={spacing}
                sx={{ overflowX: 'auto', px: gutter, pb: 2 }}
            >
                {children}
            </Stack>
            <EdgeFade side="left" width={edgeFadeWidth} />
            <EdgeFade side="right" width={edgeFadeWidth} />
        </Box>
    )
}
