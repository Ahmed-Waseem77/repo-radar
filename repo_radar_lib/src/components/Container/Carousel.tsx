import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Box } from '@mui/material'

export type CarouselOrientation = 'horizontal' | 'vertical'
// 'row': a single scrolling line along `orientation`'s axis (the original behavior).
// 'grid': items wrap onto multiple lines instead, still scrolling along `orientation`'s axis -
// e.g. a vertically-scrolling grid of cards, several per row, instead of one long row.
export type CarouselLayout = 'row' | 'grid'

export interface CarouselProps {
    children: ReactNode
    // gap between items, in theme spacing units
    spacing?: number
    // padding on the scroll track's start/end edges (along `orientation`'s axis), in theme spacing units
    gutter?: number
    // width/height (px) of each edge's fade-to-background overlay, along `orientation`'s axis
    edgeFadeWidth?: number
    // which axis scrolls - 'horizontal' (default) matches the original row-of-cards behavior.
    orientation?: CarouselOrientation
    layout?: CarouselLayout
    // caps the scroll track's size along `orientation`'s axis - required for 'vertical' to
    // actually scroll instead of just growing to fit its content; 'horizontal' doesn't need it
    // since that axis already sizes to the viewport it's rendered in.
    maxHeight?: number | string
    // set false to disable the automatic scrolling entirely (still scrollable by the user)
    autoScroll?: boolean
    // ms to wait after mount before auto-scrolling starts
    autoScrollDelay?: number
    // px advanced per tick once it starts - together with tickMs this sets the scroll speed
    autoScrollStep?: number
    tickMs?: number
}

const DEFAULT_EDGE_FADE_WIDTH = 56

// one fade-to-background overlay, reused for both edges of either axis (mirrored via
// `orientation`/`side`) instead of four near-identical Boxes - an inset box-shadow on the scroll
// track itself would paint BEHIND its children, which are typically fully opaque (cards, pills,
// borders), so they'd hide it entirely; this paints on top instead, as a sibling positioned over
// each edge.
//
// zIndex needs to be explicit and higher than any interactive content inside the track (e.g.
// RepoOverviewCompact lifts its title/commit-hash links and Track button to zIndex:1 so they
// win hit-testing over its own internal "view details" overlay button). The scroll track isn't
// itself positioned, so those descendants are promoted straight into THIS stacking context and
// painted by z-index like any other child here - without an explicit, higher zIndex the fade
// (z-index:auto) would sit BEHIND them instead of over them. pointerEvents:none keeps that
// purely visual, not blocking clicks on what's underneath.
function EdgeFade({
    orientation,
    side,
    size,
}: {
    orientation: CarouselOrientation
    side: 'start' | 'end'
    size: number
}) {
    const horizontal = orientation === 'horizontal'
    const edgePosition = horizontal
        ? { top: 0, bottom: 0, [side === 'start' ? 'left' : 'right']: 0, width: size }
        : { left: 0, right: 0, [side === 'start' ? 'top' : 'bottom']: 0, height: size }
    const gradientDirection = horizontal
        ? side === 'start' ? 'to right' : 'to left'
        : side === 'start' ? 'to bottom' : 'to top'

    return (
        <Box
            aria-hidden
            sx={(theme) => ({
                position: 'absolute',
                ...edgePosition,
                zIndex: 2,
                pointerEvents: 'none',
                background: `linear-gradient(${gradientDirection}, ${theme.vars?.palette.background.default ?? theme.palette.background.default}, transparent)`,
            })}
        />
    )
}

// A scrolling row (or wrapping grid) with fade-to-background edges, matching what App.tsx built
// inline for its "Trending Repos" row (see that component's history) - generalized here so any
// collection of content can reuse it instead of re-implementing the edge-fade/scroll-track
// pattern, whether it's a single auto-scrolling line or a manually-scrolled grid.
//
// When autoScroll is on, it waits `autoScrollDelay` after mount and then advances
// `autoScrollStep`px every `tickMs` along `orientation`'s axis on its own; reaching either end
// reverses direction instead of snapping back to the start, so it bounces back and forth rather
// than jumping. Hovering pauses it (a paused ref, not state, so hovering doesn't tear down/restart
// the interval or reset the initial delay) - useful since carousel items are often clickable
// themselves.
export default function Carousel({
    children,
    spacing = 2,
    gutter = 0,
    edgeFadeWidth = DEFAULT_EDGE_FADE_WIDTH,
    orientation = 'horizontal',
    layout = 'row',
    maxHeight,
    autoScroll = true,
    autoScrollDelay = 2000,
    autoScrollStep = 1,
    tickMs = 30,
}: CarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const pausedRef = useRef(false)
    const horizontal = orientation === 'horizontal'

    useEffect(() => {
        if (!autoScroll) return
        const el = scrollRef.current
        if (!el) return

        let intervalId: ReturnType<typeof setInterval> | undefined
        let direction: 1 | -1 = 1

        const timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                if (pausedRef.current) return
                const scrollPos = horizontal ? el.scrollLeft : el.scrollTop
                const clientSize = horizontal ? el.clientWidth : el.clientHeight
                const scrollSize = horizontal ? el.scrollWidth : el.scrollHeight
                if (scrollPos + clientSize >= scrollSize - 1) {
                    direction = -1
                } else if (scrollPos <= 0) {
                    direction = 1
                }
                if (horizontal) {
                    el.scrollLeft += direction * autoScrollStep
                } else {
                    el.scrollTop += direction * autoScrollStep
                }
            }, tickMs)
        }, autoScrollDelay)

        return () => {
            clearTimeout(timeoutId)
            clearInterval(intervalId)
        }
    }, [autoScroll, autoScrollDelay, autoScrollStep, tickMs, horizontal])

    return (
        <Box
            sx={{
                position: 'relative',
                ...(horizontal ? {} : { height: '100%', minHeight: 0 }),
            }}
            onMouseEnter={() => { pausedRef.current = true }}
            onMouseLeave={() => { pausedRef.current = false }}
        >
            <Box
                ref={scrollRef}
                sx={(theme) => ({
                    display: 'flex',
                    flexDirection: layout === 'grid' || horizontal ? 'row' : 'column',
                    flexWrap: layout === 'grid' ? 'wrap' : 'nowrap',
                    // a grid's rows/items default to stretch, which grows every card to match
                    // the tallest one in its row (and each row to fill the whole scroll track) -
                    // grid items should keep their own natural height instead, and sit centered
                    // in the row rather than pinned to the start.
                    ...(layout === 'grid' && {
                        alignItems: 'flex-start',
                        alignContent: 'flex-start',
                        justifyContent: 'center',
                    }),
                    gap: theme.spacing(spacing),
                    overflowX: horizontal ? 'auto' : 'hidden',
                    overflowY: horizontal ? 'hidden' : 'auto',
                    px: horizontal ? gutter : 0,
                    py: horizontal ? 0 : gutter,
                    pb: horizontal ? 2 : undefined,
                    height: horizontal ? undefined : '100%',
                    maxHeight: horizontal ? undefined : maxHeight,
                })}
            >
                {children}
            </Box>
            <EdgeFade orientation={orientation} side="start" size={edgeFadeWidth} />
            <EdgeFade orientation={orientation} side="end" size={edgeFadeWidth} />
        </Box>
    )
}
