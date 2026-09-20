import { useState } from 'react'
import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import {
  AppBar,
  Button,
  ColorModeToggle,
  LogoIcon,
  NoSearchIcon,
  Pill,
  RepoOverviewCompact,
  RepoOverviewTablePagination,
} from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps, RepoOverviewProps } from '@radar-repo/radar-repo-lib'
import { useCtrlKFocus } from './hooks/useCtrlKFocus'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useSearchRepo, useTrendingRepos } from './hooks/api'
import { TRENDING_REPO_COUNT } from './api/github'

function App() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [trackedTitles, setTrackedTitles] = useState<Set<string>>(new Set())
  const searchRef = useCtrlKFocus<HTMLInputElement>()

  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const { data, loading, error } = useSearchRepo(
    debouncedSearch ? { query: debouncedSearch, page: page + 1, perPage: rowsPerPage } : null,
  )
  const { data: trendingData, loading: trendingLoading, error: trendingError } = useTrendingRepos()

  const onTrack = (title: string) => {
    setTrackedTitles((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  // TODO: navigate to a repo detail view once that page exists
  const onDetailedView = (title: string) => {
    console.log('detailed view requested for', title)
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
        description: '',
        lastCommit: { hash: '', date: '', developerName: '' },
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
        onTrack: () => onTrack(repo.title),
        onDetailedView: () => onDetailedView(repo.title),
        loading: false,
        tracked: trackedTitles.has(repo.title),
      }))
      count = data.totalCount
      emptyStateLabel = 'No repositories found'
    }
  }

  const trendingRepos: RepoOverviewCompactProps[] = trendingData
    ? trendingData.items.map((repo) => ({
        ...repo,
        onTrack: () => onTrack(repo.title),
        onDetailedView: () => onDetailedView(repo.title),
        loading: false,
        tracked: trackedTitles.has(repo.title),
      }))
    : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        ref={searchRef}
        searchValue={search}
        onSearchChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }}
        start={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <LogoIcon />
            <Typography variant="h6">Repo Radar</Typography>
          </Stack>
        }
        end={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              variant="text"
              size="medium"
              label="Tracked Repos"
              sx={(theme) => ({
                color: 'text.primary',
                fontWeight: 700,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  bottom: 6,
                  width: 0,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: 'text.primary',
                  transform: 'translateX(-50%)',
                  transition: theme.transitions.create('width'),
                },
                '&:hover::after, &:focus-visible::after': {
                  width: '70%',
                },
              })}
            />
            <ColorModeToggle />
          </Stack>
        }
      />
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
            results) - once real rows are showing, this section gets out of their way entirely */}
        {repos.length === 0 && (
          <>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Container maxWidth="md" sx={{ py: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Trending Repos
                </Typography>
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
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
                        description=""
                        lastCommit={{ hash: '', date: '', developerName: '' }}
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
                    trendingRepos.map((repo) => <RepoOverviewCompact key={repo.title} {...repo} />)
                  )}
                </Stack>
              </Container>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

export default App
