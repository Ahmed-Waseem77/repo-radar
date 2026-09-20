import { useState } from 'react'
import { Box, Container, Divider, Fade, Typography } from '@mui/material'
import {
  Carousel,
  getRepoKey,
  NoSearchIcon,
  Pill,
  RepoOverviewCompact,
  RepoOverviewTablePagination,
} from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps, RepoOverviewProps } from '@radar-repo/radar-repo-lib'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useSearchRepo, useTrendingRepos } from '../hooks/api'
import { TRENDING_REPO_COUNT } from '../api/github'
import type { RepoDto } from '../api/github/mappers'

// shared by the "Trending Repos" heading and the scroll row below it, so their left edges
// actually line up instead of each picking their own padding
const SCROLL_GUTTER = 3

export interface HomepageProps {
  // raw (undebounced) search text - owned by App.tsx since it also drives AppBar's search field
  search: string
  trackedKeys: Set<string>
  onToggleTrack: (repo: RepoDto) => void
}

export function Homepage({ search, trackedKeys, onToggleTrack }: HomepageProps) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  // Adjusting state during render (React's documented pattern for "reset state when a prop
  // changes") rather than in an effect - covers both the user typing a new query and Escape
  // clearing it back to '' (handled by App.tsx), either way the result set changes out from
  // under whatever page we were on. React re-renders immediately with the reset page before
  // committing, so this never paints a stale page against new results.
  const [settledSearch, setSettledSearch] = useState(debouncedSearch)
  if (debouncedSearch !== settledSearch) {
    setSettledSearch(debouncedSearch)
    setPage(0)
  }

  const { data, loading, error } = useSearchRepo(
    debouncedSearch ? { query: debouncedSearch, page: page + 1, perPage: rowsPerPage } : null,
  )
  const { data: trendingData, loading: trendingLoading, error: trendingError } = useTrendingRepos()

  // TODO: navigate to a repo detail view once that page exists
  const onDetailedView = (repoKey: string) => {
    console.log('detailed view requested for', repoKey)
  }

  let repos: RepoOverviewProps[] = []
  let emptyStateLabel = 'start searching for repos to track'
  let count: number | undefined

  if (debouncedSearch) {
    if (error) {
      emptyStateLabel = `Something went wrong searching GitHub: ${error.message}`
    } else if (loading || !data) {
      repos = Array.from({ length: rowsPerPage }, (_, i) => ({
        title: `loading-${i}`,
        owner: '',
        url: '',
        ownerUrl: '',
        description: '',
        lastCommit: { hash: '', date: '', developerName: '', url: '' },
        starCount: 0,
        languageInfo: { languages: [], distribution: [] },
        topics: [],
        archived: false,
        onTrack: () => {},
        onDetailedView: () => {},
        loading: true,
        tracked: false,
      }))
      count = rowsPerPage
    } else {
      repos = data.items.map((repo) => ({
        ...repo,
        onTrack: () => onToggleTrack(repo),
        onDetailedView: () => onDetailedView(getRepoKey(repo)),
        loading: false,
        tracked: trackedKeys.has(getRepoKey(repo)),
      }))
      count = data.totalCount
      emptyStateLabel = 'No repositories found'
    }
  }

  const trendingRepos: RepoOverviewCompactProps[] = trendingData
    ? trendingData.items.map((repo) => ({
        ...repo,
        onTrack: () => onToggleTrack(repo),
        onDetailedView: () => onDetailedView(getRepoKey(repo)),
        loading: false,
        tracked: trackedKeys.has(getRepoKey(repo)),
      }))
    : []

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Container maxWidth="md" sx={{ py: 2 }}>
          <RepoOverviewTablePagination
            repos={repos}
            count={count}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            emptyStateImage={<NoSearchIcon sx={{ width: 200, height: 'auto' }} />}
            emptyStateLabel={emptyStateLabel}
          />
        </Container>
      </Box>
      {/* only takes up room while the table itself is empty (no search yet, an error, or zero
          results) - once real rows are showing, this section gets out of their way entirely.
          Fade (rather than the plain conditional render this used to be) animates that
          transition instead of cutting the section in/out instantly. */}
      <Fade in={repos.length === 0} unmountOnExit>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Divider />
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ px: SCROLL_GUTTER, pt: 2, mb: 2 }}>
              Trending Repos
            </Typography>
            <Carousel gutter={SCROLL_GUTTER}>
              {trendingError ? (
                <Pill
                  variant="error"
                  size="large"
                  iconSize="large"
                  label={`Something went wrong loading trending repos: ${trendingError.message}`}
                />
              ) : trendingLoading || !trendingData ? (
                Array.from({ length: TRENDING_REPO_COUNT }, (_, i) => (
                  <RepoOverviewCompact
                    key={`trending-loading-${i}`}
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
              ) : (
                trendingRepos.map((repo) => <RepoOverviewCompact key={getRepoKey(repo)} {...repo} />)
              )}
            </Carousel>
          </Box>
        </Box>
      </Fade>
    </Box>
  )
}
