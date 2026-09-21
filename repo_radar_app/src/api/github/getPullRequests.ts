import { apiFetch, parseLinkHeader } from '../client'
import type { GithubIssue } from './types'

export interface PullRequestLabelDto {
    name: string
    color: string
}

export type PullRequestStatus = 'open' | 'merged' | 'closed'

export interface PullRequestDto {
    id: number
    number: number
    title: string
    // distinct from the `state` query param below: GitHub only tracks open/closed on a PR the
    // same as any issue - "merged" isn't a state, it's `state === 'closed'` with `merged_at` set,
    // so filtering ("Closed") and display (this) are deliberately two different things here, same
    // as GitHub's own PR list UI.
    status: PullRequestStatus
    url: string
    commentCount: number
    createdAt: string
    authorLogin: string | null
    authorUrl: string | null
    labels: PullRequestLabelDto[]
}

export interface GetPullRequestsParams {
    owner: string
    name: string
    state: 'open' | 'closed'
    // 1-indexed, matches GitHub's own `page` query param
    page?: number
    perPage?: number
    signal?: AbortSignal
}

export interface GetPullRequestsResult {
    items: PullRequestDto[]
    // an ESTIMATE, not an exact count - see getPullRequests for why this endpoint can't give one
    totalCount: number
}

function isPullRequest(issue: GithubIssue): boolean {
    return issue.pull_request !== undefined
}

function mapPullRequest(issue: GithubIssue): PullRequestDto {
    const status: PullRequestStatus = issue.state === 'open' ? 'open' : issue.pull_request?.merged_at ? 'merged' : 'closed'

    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        status,
        url: issue.html_url,
        commentCount: issue.comments,
        createdAt: issue.created_at,
        authorLogin: issue.user?.login ?? null,
        authorUrl: issue.user?.html_url ?? null,
        labels: issue.labels,
    }
}

// GET /repos/{owner}/{repo}/issues - the mirror image of getIssues: keeps only the items that ARE
// pull requests (isPullRequest) instead of filtering them out, via its own independent
// state/page rather than reusing whatever a concurrent Issues-tab request happens to be showing -
// see getIssues' own comment for why that byproduct-sharing approach doesn't work. Same
// estimated-total-from-the-Link-header and "a page can hold fewer than `perPage` rows" caveats
// apply here too, for the same reason.
export async function getPullRequests({ owner, name, state, page = 1, perPage = 10, signal }: GetPullRequestsParams): Promise<GetPullRequestsResult> {
    const { data, response } = await apiFetch<GithubIssue[]>({
        path: `repos/${owner}/${name}/issues`,
        query: { state, page, per_page: perPage },
        signal,
    })

    const items = data.filter(isPullRequest).map(mapPullRequest)

    const links = parseLinkHeader(response.headers.get('link'))
    const lastPage = links.last ? Number(new URL(links.last).searchParams.get('page')) : null
    const totalCount = lastPage ? lastPage * perPage : (page - 1) * perPage + items.length

    return { items, totalCount }
}
