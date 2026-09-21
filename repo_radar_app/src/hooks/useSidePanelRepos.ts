import { getRepoKey } from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps } from '@radar-repo/radar-repo-lib'
import { useDebouncedValue } from './useDebouncedValue'
import { useSearchRepo, useTrendingRepos } from './api'
import type { RepoDto } from '../api/github/mappers'
import type { TrackedRepo } from '../api/trackedRepos'

// matches Homepage's own default rowsPerPage - a side panel doesn't paginate itself, this is just
// how many of the top results it shows at once.
const SIDE_PANEL_REPO_COUNT = 10

export interface UseSidePanelReposParams {
    search: string
    searchScope: 'global' | 'tracked'
    trackedRepos: TrackedRepo[]
    trackedKeys: Set<string>
    onToggleTrack: (repo: RepoDto) => void
    onUntrack: (repoKey: string) => void
    // switches the detail view to a DIFFERENT repo clicked in the side panel
    onSelectRepo: (repo: RepoDto) => void
}

// 'empty' is nothing to show at all regardless of any filter (e.g. nothing tracked yet); 'notFound'
// is a search/filter that matched zero of an otherwise non-empty list - same isEmpty/hasNoMatches
// distinction TrackedRepos itself already draws, carried over here so the wording matches.
export type SidePanelState =
    | { status: 'loading' }
    | { status: 'error'; error: Error }
    | { status: 'empty'; message: string }
    | { status: 'notFound'; message: string }
    | { status: 'ready'; repos: RepoOverviewCompactProps[] }

// RepoDetailPage's side panel needs to keep reflecting whatever the underlying search/tracked
// context is live, exactly like it did when the detail view was rendered by whichever page was
// open (Homepage or TrackedRepos) - this mirrors each page's own side-panel logic (Homepage's
// `debouncedSearch ? searchResults : trendingRepos`; TrackedRepos' own client-side text filter)
// rather than freezing it to "whatever trending looked like when this repo was opened."
export function useSidePanelRepos({
    search,
    searchScope,
    trackedRepos,
    trackedKeys,
    onToggleTrack,
    onUntrack,
    onSelectRepo,
}: UseSidePanelReposParams): SidePanelState {
    const debouncedSearch = useDebouncedValue(search.trim(), 400)

    const {
        data: searchData,
        loading: searchLoading,
        error: searchError,
    } = useSearchRepo(searchScope === 'global' && debouncedSearch ? { query: debouncedSearch, page: 1, perPage: SIDE_PANEL_REPO_COUNT } : null)
    const { data: trendingData, loading: trendingLoading, error: trendingError } = useTrendingRepos()

    if (searchScope === 'tracked') {
        if (trackedRepos.length === 0) {
            return { status: 'empty', message: 'Track a repo to see it here.' }
        }

        const query = search.trim().toLowerCase()
        const filtered = query
            ? trackedRepos.filter(
                  (repo) =>
                      repo.title.toLowerCase().includes(query) ||
                      repo.owner.toLowerCase().includes(query) ||
                      repo.description.toLowerCase().includes(query),
              )
            : trackedRepos

        if (filtered.length === 0) {
            return { status: 'notFound', message: `No tracked repos match "${search.trim()}".` }
        }

        return {
            status: 'ready',
            repos: filtered.map((repo) => ({
                ...repo,
                onTrack: () => onUntrack(getRepoKey(repo)),
                onDetailedView: () => onSelectRepo(repo),
                loading: false,
                tracked: true,
            })),
        }
    }

    if (debouncedSearch) {
        if (searchError) return { status: 'error', error: searchError }
        if (searchLoading || !searchData) return { status: 'loading' }
        if (searchData.items.length === 0) return { status: 'notFound', message: `No repositories found for "${debouncedSearch}".` }

        return {
            status: 'ready',
            repos: searchData.items.map((repo) => ({
                ...repo,
                onTrack: () => onToggleTrack(repo),
                onDetailedView: () => onSelectRepo(repo),
                loading: false,
                tracked: trackedKeys.has(getRepoKey(repo)),
            })),
        }
    }

    if (trendingError) return { status: 'error', error: trendingError }
    if (trendingLoading || !trendingData) return { status: 'loading' }
    if (trendingData.items.length === 0) return { status: 'empty', message: 'No trending repositories right now.' }

    return {
        status: 'ready',
        repos: trendingData.items.map((repo) => ({
            ...repo,
            onTrack: () => onToggleTrack(repo),
            onDetailedView: () => onSelectRepo(repo),
            loading: false,
            tracked: trackedKeys.has(getRepoKey(repo)),
        })),
    }
}
