import { useState } from 'react'
import { Box } from '@mui/material'
import { LogoIcon, LogoLeftIcon, LogoRightIcon, LogoStaticIcon } from '@radar-repo/radar-repo-lib'
import { useRandomInterval } from '../hooks/useRandomInterval'

// This grid's proportions are tuned for a 1080p (1920x1080) screen, and expressed in vw (not px)
// scaled from that reference - NOT window.innerWidth/innerHeight in raw pixels. Browser zoom
// changes how many CSS pixels fit in the viewport (that's what innerWidth/innerHeight measure),
// so sizing from those directly meant every zoom step recomputed the column/row counts and
// reshuffled the whole random pattern. vw units are recalculated by the browser natively on ANY
// viewport change - zoom or an actual window resize - so using them keeps this scaling smoothly
// and uniformly (same factor on both axes, so hexagons never distort into ellipses) with zero JS
// involved after mount: no resize listener, nothing to reshuffle.
const REFERENCE_WIDTH = 1920
const REFERENCE_HEIGHT = 1080

// reference sizes in px, used only to work out how many rows/columns are needed at 1080p - never
// used directly as a rendered dimension (see toVw below for that).
const CELL_SIZE_PX = 56
const ROW_HEIGHT_PX = CELL_SIZE_PX * 0.75
const COLUMN_GAP_PX = CELL_SIZE_PX * 0.25
const COLUMN_STRIDE_PX = CELL_SIZE_PX + COLUMN_GAP_PX

const toVw = (px: number) => `${(px / REFERENCE_WIDTH) * 100}vw`

const CELL_SIZE = toVw(CELL_SIZE_PX)
const COLUMN_GAP = toVw(COLUMN_GAP_PX)

// extra columns/rows rendered PAST EACH edge (not just appended at the end) - the grid is shifted
// up-and-left by exactly this much (see the row Box's top/left below), so content overflows every
// side rather than only the right/bottom. A bit more headroom on rows than the reference 16:9
// ratio strictly needs, to cover moderately-taller-than-16:9 screens (e.g. 16:10) too.
const OVERFLOW_COLUMNS = 2
const OVERFLOW_ROWS = 4

const COLUMNS = Math.ceil(REFERENCE_WIDTH / COLUMN_STRIDE_PX) + OVERFLOW_COLUMNS * 2
const ROWS = Math.ceil(REFERENCE_HEIGHT / ROW_HEIGHT_PX) + OVERFLOW_ROWS * 2

const LOGO_ANIMATION_MIN_INTERVAL_MS = 12_000
const LOGO_ANIMATION_MAX_INTERVAL_MS = 40_000

// a small, fixed handful of animated (Lottie-backed) cells, regardless of how big the grid
// itself is - each mounts its own lottie-react instance even at rest, so keeping this a flat
// count (rather than every cell having an independent chance of being one) is what actually
// keeps this light, no matter how many static cells the grid ends up needing.
const LOGO_CELL_COUNT_MIN = 5
const LOGO_CELL_COUNT_MAX = 8

type CellKind = 'logo' | 'left' | 'right' | 'full'
// the three static kinds a non-animated cell is drawn from, in roughly equal proportion
const STATIC_CELL_KINDS: CellKind[] = ['left', 'right', 'full']

// a LogoIcon cell animates on its own random schedule (mirroring the AppBar's own logo) - its
// own component so each cell gets an independent useRandomInterval instance, rather than one
// shared timer that would make every LogoIcon cell flash in sync.
function AnimatedLogoCell() {
    const [playSignal, setPlaySignal] = useState<number>()
    useRandomInterval(
        () => setPlaySignal((n) => (n ?? 0) + 1),
        LOGO_ANIMATION_MIN_INTERVAL_MS,
        LOGO_ANIMATION_MAX_INTERVAL_MS,
    )
    return <LogoIcon playSignal={playSignal} sx={{ width: CELL_SIZE, height: CELL_SIZE, color: 'divider' }} />
}

const STATIC_ICON_BY_KIND: Record<Exclude<CellKind, 'logo'>, typeof LogoLeftIcon> = {
    left: LogoLeftIcon,
    right: LogoRightIcon,
    full: LogoStaticIcon,
}

function GridCell({ kind }: { kind: CellKind }) {
    if (kind === 'logo') return <AnimatedLogoCell />
    const Icon = STATIC_ICON_BY_KIND[kind]
    return <Icon sx={{ width: CELL_SIZE, height: CELL_SIZE, color: 'divider' }} />
}

// builds the whole grid: every cell starts as one of the three static kinds (cheap, no
// animation), then a small fixed count of DISTINCT cells are picked at random and promoted to
// the animated 'logo' kind - see LOGO_CELL_COUNT_MIN/MAX above for why that's a flat count
// rather than a per-cell probability.
function buildGrid(): CellKind[][] {
    const grid: CellKind[][] = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLUMNS }, (): CellKind => STATIC_CELL_KINDS[Math.floor(Math.random() * STATIC_CELL_KINDS.length)]),
    )

    const logoCellCount = LOGO_CELL_COUNT_MIN + Math.floor(Math.random() * (LOGO_CELL_COUNT_MAX - LOGO_CELL_COUNT_MIN + 1))
    const totalCells = ROWS * COLUMNS
    const logoPositions = new Set<number>()
    while (logoPositions.size < Math.min(logoCellCount, totalCells)) {
        logoPositions.add(Math.floor(Math.random() * totalCells))
    }
    for (const position of logoPositions) {
        grid[Math.floor(position / COLUMNS)][position % COLUMNS] = 'logo'
    }

    return grid
}

// A dense, decorative honeycomb of the app's own logo marks (mostly its static halves/full mark,
// plus a handful of the full animated mark) tiling a page's background.
export function HexIconGrid() {
    // computed once (lazy initializer), not on every render - both the pattern itself and its
    // proportions (see the module-level vw sizing above) are fixed for the component's lifetime
    const [grid] = useState(buildGrid)

    return (
        <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {grid.map((row, rowIndex) => (
                <Box
                    key={rowIndex}
                    sx={{
                        position: 'absolute',
                        // shifted up by OVERFLOW_ROWS worth of rows, so the first several rows
                        // render above top:0 (off the container's top edge) rather than the
                        // grid's very first row always starting flush at top:0. Computed in px
                        // and converted to vw once (toVw), rather than nesting calc() in the sx
                        // string - simpler to get right and easier to verify.
                        top: toVw((rowIndex - OVERFLOW_ROWS) * ROW_HEIGHT_PX),
                        // odd rows shift right by half a cell+gap on top of the same leftward
                        // shift - the honeycomb offset and the overflow shift are independent,
                        // so they just add together
                        left: toVw(
                            (rowIndex % 2 === 1 ? COLUMN_STRIDE_PX / 2 : 0) - OVERFLOW_COLUMNS * COLUMN_STRIDE_PX,
                        ),
                        display: 'flex',
                        gap: COLUMN_GAP,
                    }}
                >
                    {row.map((kind, colIndex) => (
                        <GridCell key={colIndex} kind={kind} />
                    ))}
                </Box>
            ))}
        </Box>
    )
}
