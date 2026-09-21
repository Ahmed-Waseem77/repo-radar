import { useState } from 'react'
import { Box, Container, Divider, Fade, Typography } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import {
  Carousel,
  getRepoKey,
  NoSearchIcon,
  Pill,
  RepoOverview,
  RepoOverviewCompact,
  RepoOverviewTablePagination,
} from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps, RepoOverviewProps } from '@radar-repo/radar-repo-lib'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useLatestRelease, useSearchRepo, useTrendingRepos } from '../hooks/api'
import { TRENDING_REPO_COUNT } from '../api/github'
import type { RepoDto } from '../api/github/mappers'
import { RepoDetailView } from '../components/RepoDetailView'

// shared by the "Trending Repos" heading and the scroll row below it, so their left edges
// actually line up instead of each picking their own padding
const SCROLL_GUTTER = 3

// the main search-results table's rows want the same latest-release badge the detail view
// already shows - but each row needs its OWN useLatestRelease call, which can only happen inside
// a dedicated component per row (a hook can't be called a variable number of times in a .map()).
// Idle (no fetch) for the fake loading-placeholder rows, since they have no real owner/title yet.
function RepoOverviewRow(repo: RepoOverviewProps) {
  const { data: latestRelease } = useLatestRelease(repo.loading ? null : { owner: repo.owner, name: repo.title })
  return <RepoOverview {...repo} latestRelease={latestRelease} languageLabelLayout="inline" languageCutoff={8} />
}

export interface HomepageProps {
  // raw (undebounced) search text - owned by App.tsx since it also drives AppBar's search field
  search: string
  trackedKeys: Set<string>
  onToggleTrack: (repo: RepoDto) => void
  // the open repo detail view, if any - lifted to App.tsx since it should close when navigating
  // away from this page entirely, not just when this page unmounts. Closing it (back button /
  // Escape) is handled entirely in App.tsx now, so this page only ever needs to OPEN one.
  selectedRepo: RepoDto | null
  onSelectRepo: (repo: RepoDto) => void
}

export function Homepage({ search, trackedKeys, onToggleTrack, selectedRepo, onSelectRepo }: HomepageProps) {
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
        onDetailedView: () => onSelectRepo(repo),
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
        onDetailedView: () => onSelectRepo(repo),
        loading: false,
        tracked: trackedKeys.has(getRepoKey(repo)),
      }))
    : []

  // the side panel mirrors whatever this page is already showing as its own main content -
  // the search results while a search is active, otherwise the trending row - rather than
  // fetching anything new for it.
  const sidePanelRepos: RepoOverviewCompactProps[] = debouncedSearch ? repos : trendingRepos

  return (
    // position:relative + each transitioning child pinned via inset:0 is what makes this a true
    // crossfade rather than a fade-in-only: TransitionGroup keeps the OUTGOING keyed child
    // mounted (playing its own exit) for the same `timeout` while the INCOMING one mounts and
    // plays its enter, so both are on screen briefly - inset:0 stacks them exactly on top of
    // each other instead of the second one just appearing below/after the first in normal flow.
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <TransitionGroup component={null}>
        <Fade key={selectedRepo ? 'detail' : 'list'} timeout={225}>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedRepo ? (
              <RepoDetailView
                repo={selectedRepo}
                tracked={trackedKeys.has(getRepoKey(selectedRepo))}
                onToggleTrack={() => onToggleTrack(selectedRepo)}
                sidePanelRepos={sidePanelRepos}
              />
            ) : (
              <>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <Container maxWidth="md" sx={{ py: 2 }}>
                    {/* the "press Esc to clear" hint now lives in the AppBar itself (it replaces
                        the logo whenever a search is active), rather than being duplicated here */}
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
                      renderRow={(repo) => <RepoOverviewRow {...repo} />}
                    />
                  </Container>
                </Box>
                {/* only takes up room while the table itself is empty (no search yet, an error, or
                    zero results) - once real rows are showing, this section gets out of their way
                    entirely. Fade (rather than a plain conditional render) animates that
                    transition instead of cutting the section in/out instantly.
                    flexShrink:0 (not flex:1/minHeight:0) so it sizes to its own content - the
                    table box above it keeps flex:1, so it's the one that absorbs any leftover
                    space, which is what pushes this section flush against the bottom edge rather
                    than stretching it to fill whatever room is left. */}
                <Fade in={repos.length === 0} unmountOnExit>
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <Divider />
                    <Box sx={{ overflow: 'auto' }}>
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
              </>
            )}
          </Box>
        </Fade>
      </TransitionGroup>
    </Box>
  )
}
