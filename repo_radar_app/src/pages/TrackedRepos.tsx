import { useState } from 'react'
import { Box, Collapse, Stack, Typography, useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { Button, Carousel, getRepoKey, NoSearchIcon, Pill, RepoOverviewCompact, StartTrackingIcon } from '@radar-repo/radar-repo-lib'
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone'
import type { TrackedRepo } from '../api/trackedRepos'

export interface TrackedReposProps {
  // the [In Tracked:] pill's query text - filtered client-side against the already-loaded list
  // below rather than hitting any API, since there's nothing left to fetch.
  search: string
  trackedRepos: TrackedRepo[]
  loading: boolean
  error: Error | null
  onUntrack: (repoKey: string) => void
}

const LOADING_PLACEHOLDER_COUNT = 6
// caps the bar chart to a legible number of columns regardless of how many repos are tracked/matched
const MAX_CHART_REPOS = 8

// TODO: navigate to a repo detail view once that page exists
const onDetailedView = (repoKey: string) => {
  console.log('detailed view requested for', repoKey)
}

export function TrackedRepos({ search, trackedRepos, loading, error, onUntrack }: TrackedReposProps) {
  const theme = useTheme()
  // collapsed by default so the grid isn't shoved down by a chart nobody asked to see yet
  const [chartExpanded, setChartExpanded] = useState(false)
  const query = search.trim().toLowerCase()
  const filteredRepos = query
    ? trackedRepos.filter(
        (repo) =>
          repo.title.toLowerCase().includes(query) ||
          repo.owner.toLowerCase().includes(query) ||
          repo.description.toLowerCase().includes(query),
      )
    : trackedRepos

  const isEmpty = !loading && !error && trackedRepos.length === 0
  const hasNoMatches = !loading && !error && !isEmpty && query !== '' && filteredRepos.length === 0

  if (error) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: 3 }}>
        <Pill
          variant="error"
          size="large"
          iconSize="large"
          label={`Something went wrong loading tracked repos: ${error.message}`}
        />
      </Box>
    )
  }

  if (isEmpty || hasNoMatches) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {/* isEmpty: nothing tracked yet, invites the user to start - hasNoMatches: something IS
            tracked, just not matching this search, so the search-specific icon fits better */}
        {isEmpty ? (
          <StartTrackingIcon sx={{ width: 200, height: 'auto' }} />
        ) : (
          <NoSearchIcon sx={{ width: 200, height: 'auto' }} />
        )}
        <Typography variant="body1" color="textDimmed">
          {isEmpty ? 'Track a repo to see it here.' : `No tracked repos match "${search.trim()}".`}
        </Typography>
      </Box>
    )
  }

  const chartRepos = [...filteredRepos].sort((a, b) => b.starCount - a.starCount).slice(0, MAX_CHART_REPOS)
  const topRepo = chartRepos[0]

  return (
    <Box sx={{ flex: 1, minHeight: 0, py: 2, display: 'flex', flexDirection: 'column' }}>
      {!loading && topRepo && (
        <Box sx={{ flexShrink: 0, px: 3, pb: chartExpanded ? 1 : 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">Most Starred: {getRepoKey(topRepo)}</Typography>
            <Button
              variant="text"
              size="small"
              label={chartExpanded ? 'Hide Chart' : 'See Chart'}
              onClick={() => setChartExpanded((expanded) => !expanded)}
              endIcon={<ExpandMoreTwoToneIcon />}
              sx={(theme) => ({
                '& .MuiButton-endIcon': {
                  transform: chartExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: theme.transitions.create('transform'),
                },
              })}
            />
          </Stack>
          {/* unmountOnExit - no point keeping an off-screen chart (and its hover/tooltip
              listeners) mounted while collapsed */}
          <Collapse in={chartExpanded} unmountOnExit>
            <BarChart
              height={260}
              sx={{ mt: 1 }}
              series={[
                {
                  data: chartRepos.map((repo) => repo.starCount),
                  label: 'Stars',
                  color: theme.vars?.palette.primary.main ?? theme.palette.primary.main,
                },
              ]}
              xAxis={[{ data: chartRepos.map((repo) => getRepoKey(repo)), scaleType: 'band', label: 'Repo' }]}
              yAxis={[{ label: 'Stars' }]}
              hideLegend
            />
          </Collapse>
        </Box>
      )}
      {/* flex:1/minHeight:0 rather than relying on the outer Box (now shared with the chart
          above) - gives the vertical grid a bounded height to actually scroll within, same
          inner-shadow-edge trick Carousel uses for the horizontal "Trending Repos" row */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Carousel orientation="vertical" layout="grid" autoScroll={false} gutter={3}>
          {loading
            ? Array.from({ length: LOADING_PLACEHOLDER_COUNT }, (_, i) => (
                <RepoOverviewCompact
                  key={`tracked-loading-${i}`}
                  title={`loading-${i}`}
                  owner=""
                  url=""
                  ownerUrl=""
                  description=""
                  lastCommit={{ hash: '', date: '', developerName: '', url: '' }}
                  starCount={0}
                  languageInfo={{ languages: [], distribution: [] }}
                  topics={[]}
                  archived={false}
                  onTrack={() => {}}
                  onDetailedView={() => {}}
                  loading
                  tracked={false}
                />
              ))
            : filteredRepos.map((repo) => (
                <RepoOverviewCompact
                  key={getRepoKey(repo)}
                  {...repo}
                  onTrack={() => onUntrack(getRepoKey(repo))}
                  onDetailedView={() => onDetailedView(getRepoKey(repo))}
                  loading={false}
                  tracked
                />
              ))}
        </Carousel>
      </Box>
    </Box>
  )
}
