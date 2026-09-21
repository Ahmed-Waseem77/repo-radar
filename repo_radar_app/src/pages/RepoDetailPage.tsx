import { Box, CircularProgress } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { getRepoKey, Pill } from '@radar-repo/radar-repo-lib'
import { useGetRepo } from '../hooks/api'
import { useSidePanelRepos } from '../hooks/useSidePanelRepos'
import type { RepoDto } from '../api/github/mappers'
import type { TrackedRepo } from '../api/trackedRepos'
import { RepoDetailView } from '../components/RepoDetailView'

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
}: RepoDetailPageProps) {
    const navigate = useNavigate()
    const { owner = '', name = '' } = useParams()
    const cacheHit = cachedRepo !== null && cachedRepo.owner === owner && cachedRepo.title === name

    const { data: fetchedRepo, error } = useGetRepo(cacheHit ? null : { owner, name })

    // switches to that repo - a `replace` navigation, same as switching repos already did before
    // this page existed, so one browser-back press still exits the view outright regardless of
    // how many repos were viewed here via the side panel.
    const selectSidePanelRepo = (repo: RepoDto) =>
        navigate(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.title)}`, { replace: true })

    const sidePanelState = useSidePanelRepos({
        search,
        searchScope,
        trackedRepos,
        trackedKeys,
        onToggleTrack,
        onUntrack,
        onSelectRepo: selectSidePanelRepo,
    })

    const repo = cacheHit ? cachedRepo : fetchedRepo

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
        />
    )
}
