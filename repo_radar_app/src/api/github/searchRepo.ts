import { apiFetch, parseLinkHeader } from '../client'
import { fetchRepoExtras } from './fetchRepoExtras'
import { mapGithubRepoToDto } from './mappers'
import type { RepoDto } from './mappers'
import type { GithubSearchReposResponse } from './types'

export interface SearchRepoParams {
    query: string
    // 1-indexed, matches GitHub's own `page` query param
    page?: number
    perPage?: number
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated'
    order?: 'asc' | 'desc'
    signal?: AbortSignal
}

export interface SearchRepoResult {
    items: RepoDto[]
    totalCount: number
    // from the `Link` response header rather than totalCount/perPage math, per GitHub's own
    // pagination guidance - https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
    hasNextPage: boolean
}

// GET /search/repositories - one GitHub page per call, sized to match the UI's current page/
// rowsPerPage so TablePagination page changes map 1:1 to a request instead of pre-fetching
// everything up front.
export async function searchRepo({
    query,
    page = 1,
    perPage = 10,
    sort,
    order,
    signal,
}: SearchRepoParams): Promise<SearchRepoResult> {
    const { data, response } = await apiFetch<GithubSearchReposResponse>({
        path: 'search/repositories',
        query: { q: query, page, per_page: perPage, sort, order },
        signal,
    })

    const items = await Promise.all(
        data.items.map(async (repo) => {
            try {
                const extras = await fetchRepoExtras(repo.owner.login, repo.name, signal)
                return mapGithubRepoToDto(repo, extras)
            } catch (error) {
                // a stale/cancelled request should still reject normally, not silently resolve
                // with degraded data - the caller's own abort handling depends on that
                if (signal?.aborted) throw error
                // any other per-repo enrichment failure degrades just this one row (its commit
                // section renders a "not found" notice) instead of failing the entire search -
                // the base repo fields below all come straight from this search response, not
                // from the failed call, so they're unaffected.
                return mapGithubRepoToDto(repo, { lastCommit: null, languageInfo: { languages: [], distribution: [] } })
            }
        }),
    )

    const links = parseLinkHeader(response.headers.get('link'))

    return {
        items,
        totalCount: data.total_count,
        hasNextPage: Boolean(links.next),
    }
}
