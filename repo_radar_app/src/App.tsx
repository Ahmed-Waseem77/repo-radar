import { useState } from 'react'
import { Box, Container, Divider, Fade, Stack, Typography } from '@mui/material'
import {
  AppBar,
  Button,
  Carousel,
  ColorModeToggle,
  getRepoKey,
  LogoIcon,
  NoSearchIcon,
  Pill,
  RepoOverviewCompact,
  RepoOverviewTablePagination,
} from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps, RepoOverviewProps } from '@radar-repo/radar-repo-lib'
import { useCtrlKFocus } from './hooks/useCtrlKFocus'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { useEscapeClearSearch } from './hooks/useEscapeClearSearch'
import { useRandomInterval } from './hooks/useRandomInterval'
import { useSearchRepo, useTrendingRepos } from './hooks/api'
import { TRENDING_REPO_COUNT } from './api/github'

// shared by the "Trending Repos" heading and the scroll row below it, so their left edges
// actually line up instead of each picking their own padding
const SCROLL_GUTTER = 3

const LOGO_ANIMATION_MIN_INTERVAL_MS = 10_000 // 10 seconds
const LOGO_ANIMATION_MAX_INTERVAL_MS = 12 * 10_000 // 2 minutes

// detected once at module load - navigator.platform doesn't change during the app's lifetime.
// useCtrlKFocus already listens for either metaKey or ctrlKey, so Cmd+K already focuses the
// search field on macOS regardless of this - this only fixes the displayed hint text, which
// was always hardcoded to "Ctrl"/"K".
const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const searchShortcutKeys: [string, string] = isMacOS ? ['Cmd', 'K'] : ['Ctrl', 'K']

function App() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [trackedRepoKeys, setTrackedRepoKeys] = useState<Set<string>>(new Set())
  const searchRef = useCtrlKFocus<HTMLInputElement>()

  // undefined until the first random-interval tick, deliberately - see LogoIcon's playSignal
  // prop for why a defined value from the start would fire the animation on page load
  const [logoPlaySignal, setLogoPlaySignal] = useState<number>()
  useRandomInterval(
    () => setLogoPlaySignal((n) => (n ?? 0) + 1),
    LOGO_ANIMATION_MIN_INTERVAL_MS,
    LOGO_ANIMATION_MAX_INTERVAL_MS,
  )

  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  useEscapeClearSearch(searchRef, search.trim() !== '', () => {
    setSearch('')
    setPage(0)
  })

  const { data, loading, error } = useSearchRepo(
    debouncedSearch ? { query: debouncedSearch, page: page + 1, perPage: rowsPerPage } : null,
  )
  const { data: trendingData, loading: trendingLoading, error: trendingError } = useTrendingRepos()

  const onTrack = (repoKey: string) => {
    setTrackedRepoKeys((prev) => {
      const next = new Set(prev)
      if (next.has(repoKey)) {
        next.delete(repoKey)
      } else {
        next.add(repoKey)
      }
      return next
    })
  }

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
        onTrack: () => onTrack(getRepoKey(repo)),
        onDetailedView: () => onDetailedView(getRepoKey(repo)),
        loading: false,
        tracked: trackedRepoKeys.has(getRepoKey(repo)),
      }))
      count = data.totalCount
      emptyStateLabel = 'No repositories found'
    }
  }

  const trendingRepos: RepoOverviewCompactProps[] = trendingData
    ? trendingData.items.map((repo) => ({
        ...repo,
        onTrack: () => onTrack(getRepoKey(repo)),
        onDetailedView: () => onDetailedView(getRepoKey(repo)),
        loading: false,
        tracked: trackedRepoKeys.has(getRepoKey(repo)),
      }))
    : []

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        ref={searchRef}
        searchValue={search}
        shortcutKeys={searchShortcutKeys}
        onSearchChange={(event) => {
          setSearch(event.target.value)
          setPage(0)
        }}
        start={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <LogoIcon playSignal={logoPlaySignal} sx={{height: 40, width: 40}} />
                <Stack direction="column" spacing={-2}>
                    <Typography variant="h6">Repo</Typography>
                    <Typography variant="h6">Radar</Typography>
                </Stack>
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
    </Box>
  )
}

export default App
