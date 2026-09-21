import { Box, Skeleton, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LineChart } from '@mui/x-charts/LineChart'
import { EmptyState } from '@radar-repo/radar-repo-lib'
import { useStarHistory } from '../../hooks/api'

const STAR_HISTORY_CHART_HEIGHT = 440

// only mounted while the Star History tab is active (same "fetch on click" reasoning as the other
// tabs, and only reachable at all once getStarHistoryPeriod says this repo isn't too young).
// Backed by GET /repos/{owner}/{repo}/stargazers/history (see getStarHistory) - shows a weekly
// RATE (stars gained that week), not a cumulative running total - see that file for why.
// `periodMonths` only affects the title text here, not the fetch itself - getStarHistory always
// requests up to its own max window and GitHub naturally returns less for a younger repo, so the
// chart already shows the right data regardless; this is purely about not mislabeling it.
export function StarHistorySection({ owner, name, periodMonths }: { owner: string; name: string; periodMonths: number }) {
    const theme = useTheme()
    const { data, loading, error } = useStarHistory({ owner, name })

    if (error) {
        return <EmptyState message={`Something went wrong loading star history: ${error.message}`} sx={{ py: 4 }} />
    }

    if (loading || !data) {
        return (
            <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}>
                <Skeleton variant="text" width="45%" sx={{ fontSize: '1.25rem', mb: 1 }} />
                <Skeleton variant="rounded" sx={{ width: '100%', height: STAR_HISTORY_CHART_HEIGHT }} />
            </Box>
        )
    }

    if (data.length === 0) {
        return <EmptyState message="This repository has no stars yet." sx={{ py: 4 }} />
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2, overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Stars gained per week - last {periodMonths} month{periodMonths === 1 ? '' : 's'}
            </Typography>
            <LineChart
                height={STAR_HISTORY_CHART_HEIGHT}
                series={[
                    {
                        data: data.map((point) => point.starsGained),
                        label: 'Stars per week',
                        color: theme.vars?.palette.secondary.main ?? theme.palette.secondary.main,
                        area: true,
                        showMark: true,
                        curve: 'monotoneX',
                    },
                ]}
                xAxis={[
                    {
                        data: data.map((point) => new Date(point.date)),
                        scaleType: 'time',
                        label: 'Week of',
                        valueFormatter: (date: Date) => date.toLocaleDateString(),
                    },
                ]}
                yAxis={[{ label: 'Stars / week', min: 0 }]}
                grid={{ horizontal: true }}
                // tonal, matching the rest of the app: a solid line/marks in the series color (set
                // above), but the area fill - normally rendered at full, solid opacity - is faded
                // down to a translucent tint of that same color instead of a flat fill.
                sx={{ '& .MuiLineChart-area': { fillOpacity: 0.18 } }}
                hideLegend
            />
        </Box>
    )
}
