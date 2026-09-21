import { useEffect, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { getRepoKey, Pill } from '@radar-repo/radar-repo-lib'
import { useGetRepo } from '../hooks/api'
import { useNarrowScreen } from '../hooks/useNarrowScreen'
import { useSidePanelRepos } from '../hooks/useSidePanelRepos'
import type { RepoDto } from '../api/github/mappers'
import type { TrackedRepo } from '../api/trackedRepos'
import { RepoDetailView } from '../components/RepoDetailView'
import type { RefreshButtonProps } from '../components/RepoDetail'

export interface RepoDetailPageProps {
    // whatever the card that was clicked already had in hand - lets this skip its own fetch for
    // the common "opened via a click" path. A direct/refreshed load (or a side-panel switch to a
    // DIFFERENT repo, which this page navigates itself - see below) has no matching cache and
    // falls through to fetching fresh by owner/name instead.
    cachedRepo: RepoDto | null
    // raw search text + which list it applies against - same state the AppBar's search field and
    // Ctrl+K/Ctrl+J drive everywhere else, so the side panel here stays live exactly like it did
    // when the detail view was rendered by whichever page was open (see useSidePanelRepos).
    search: string
    searchScope: 'global' | 'tracked'
    trackedRepos: TrackedRepo[]
    trackedKeys: Set<string>
    onToggleTrack: (repo: RepoDto) => void
    onUntrack: (repoKey: string) => void
    // clears the raw search text - wired to App.tsx's own setSearch('') so a narrow screen's
    // side-panel search overlay (see RepoDetailView) can dismiss itself from a backdrop tap
    // without needing App.tsx's own state setter threaded down any further than this.
    onClearSearch: () => void
    // narrow-screen-only: App.tsx's own toggle for whether the search overlay is showing (see
    // its handleBack) - resolved here against this page's own `narrow`/`search` before being
    // handed to RepoDetailView, so App.tsx doesn't need to know about either.
    searchPanelOpen: boolean
    // reports this page's own refresh control up to App.tsx so it can render in the AppBar (see
    // there) on a narrow screen instead of inline here - `null` on unmount, so App.tsx clears it
    // rather than leaving a stale control pointing at a page that's no longer showing.
    onRefreshControlsChange: (controls: RefreshButtonProps | null) => void
}

// the /repos/:owner/:name route's element - a real, bookmarkable/shareable/refreshable page
// (unlike the app's other routes, this one didn't exist until getRepo/useGetRepo were wired up
// here specifically to support landing on it cold, with no repo object already in memory).
export function RepoDetailPage({
    cachedRepo,
    search,
    searchScope,
    trackedRepos,
    trackedKeys,
    onToggleTrack,
    onUntrack,
    onClearSearch,
    searchPanelOpen,
    onRefreshControlsChange,
}: RepoDetailPageProps) {
    const navigate = useNavigate()
    const narrow = useNarrowScreen()
    const { owner = '', name = '' } = useParams()
    const routeKey = `${owner}/${name}`

    // a manual refresh (RepoDetailView's refresh button) forces a fresh getRepo call even when a
    // `cachedRepo` fast path would otherwise skip it - once bumped, this repo trusts fetched data
    // from then on rather than the (potentially stale, e.g. from an old session) cached object.
    // `lastKnownRepo` is what keeps a refresh from flashing the page to its loading state: the
    // hook's own `data` clears to null the instant a new fetch starts, but a refresh should read
    // as "updating in place," not "reload the whole view" - see `repo` below.
    // Both are scoped to whichever repo is currently being viewed, reset the moment that changes
    // (adjusted during render - React's documented pattern for this, matching Homepage's own
    // debounced-search reset - rather than an effect, since there's no external system here to
    // synchronize with).
    const [refreshToken, setRefreshToken] = useState(0)
    const [lastKnownRepo, setLastKnownRepo] = useState<RepoDto | null>(null)
    const [refreshedRouteKey, setRefreshedRouteKey] = useState(routeKey)
    if (refreshedRouteKey !== routeKey) {
        setRefreshedRouteKey(routeKey)
        setRefreshToken(0)
        setLastKnownRepo(null)
    }

    const cacheHit = refreshToken === 0 && cachedRepo !== null && cachedRepo.owner === owner && cachedRepo.title === name
    const {
        data: fetchedRepo,
        loading: fetchLoading,
        error,
    } = useGetRepo(cacheHit ? null : { owner, name, refreshToken })

    const resolvedRepo = cacheHit ? cachedRepo : fetchedRepo
    if (resolvedRepo !== null && resolvedRepo !== lastKnownRepo) {
        setLastKnownRepo(resolvedRepo)
    }

    // falls back to whatever was last shown while a refresh is in flight, rather than the fetch's
    // own momentarily-null `data` - only a genuine navigation to an as-yet-unloaded repo (no cache
    // hit, no fetch settled yet, nothing previously known) has no fallback and hits the loading
    // state below.
    const repo = resolvedRepo ?? lastKnownRepo
    const isRefreshing = refreshToken > 0 && fetchLoading

    // reports this page's own refresh control up to App.tsx (see onRefreshControlsChange above) -
    // a real side effect (it mutates a DIFFERENT component's state), so this belongs in an effect
    // rather than the render body itself, unlike this file's other render-time state adjustments
    // above (which only ever touch this component's own state).
    useEffect(() => {
        onRefreshControlsChange({ onRefresh: () => setRefreshToken((token) => token + 1), refreshing: isRefreshing })
        return () => onRefreshControlsChange(null)
    }, [isRefreshing, onRefreshControlsChange])

    // switches to that repo - a `replace` navigation, same as switching repos already did before
    // this page existed, so one browser-back press still exits the view outright regardless of
    // how many repos were viewed here via the side panel.
    const selectSidePanelRepo = (repo: RepoDto) => {
        navigate(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.title)}`, { replace: true })
        // on a narrow screen the panel is the search overlay (see RepoDetailView) - picking a
        // result is what "goes back to RepoDetail view" per the design, so clearing the search
        // closes it. On a wide screen the panel is a permanent live-filtered column instead -
        // clearing the query there would reset it back to the unfiltered list on every click,
        // which would fight the "search keeps updating the side panel" behavior it's meant to have.
        if (narrow) onClearSearch()
    }

    const sidePanelState = useSidePanelRepos({
        search,
        searchScope,
        trackedRepos,
        trackedKeys,
        onToggleTrack,
        onUntrack,
        onSelectRepo: selectSidePanelRepo,
    })

    if (!repo) {
        if (error) {
            return (
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: 3 }}>
                    <Pill variant="error" size="large" iconSize="large" label={`Something went wrong loading this repo: ${error.message}`} />
                </Box>
            )
        }
        return (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <RepoDetailView
            repo={repo}
            tracked={trackedKeys.has(getRepoKey(repo))}
            onToggleTrack={() => onToggleTrack(repo)}
            sidePanelState={sidePanelState}
            onRefresh={() => setRefreshToken((token) => token + 1)}
            refreshing={isRefreshing}
            searchPanelVisible={narrow && searchPanelOpen && search.trim() !== ''}
            onClearSearch={onClearSearch}
        />
    )
}
