import { apiFetch, parseLinkHeader } from '../client'
import type { GithubIssue } from './types'

export interface IssueLabelDto {
    name: string
    color: string
}

export interface IssueDto {
    id: number
    number: number
    title: string
    state: 'open' | 'closed'
    url: string
    commentCount: number
    createdAt: string
    authorLogin: string | null
    authorUrl: string | null
    labels: IssueLabelDto[]
}

export interface GetIssuesParams {
    owner: string
    name: string
    state: 'open' | 'closed'
    // an exact label name - GitHub ANDs multiple comma-separated names together, but the UI only
    // ever offers a single-select filter, so this stays a single optional name rather than a list.
    label?: string
    // 1-indexed, matches GitHub's own `page` query param
    page?: number
    perPage?: number
    signal?: AbortSignal
}

export interface GetIssuesResult {
    items: IssueDto[]
    // an ESTIMATE, not an exact count - see getIssues for why this endpoint can't give one
    totalCount: number
}

function isPullRequest(issue: GithubIssue): boolean {
    return issue.pull_request !== undefined
}

function mapIssue(issue: GithubIssue): IssueDto {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        commentCount: issue.comments,
        createdAt: issue.created_at,
        authorLogin: issue.user?.login ?? null,
        authorUrl: issue.user?.html_url ?? null,
        labels: issue.labels,
    }
}

// GET /repos/{owner}/{repo}/issues - deliberately not GET /search/issues: GitHub's REST API
// considers every pull request an issue, so this endpoint's response is a mix of both -
// isPullRequest (the `pull_request` key) is what tells them apart, and this one only ever keeps
// the non-PR items. getPullRequests hits this exact same endpoint independently (its own
// state/page, its own request) and keeps the OTHER half instead - a plain byproduct-sharing
// approach (reusing whichever PR items happened to land on an Issues-tab page) was considered
// and rejected: that page's pagination is scoped to Issues' own filters, so it can't produce a
// correctly paginated, complete PR list on its own. One GitHub page per call, sized to match the
// UI's current page/rowsPerPage, same approach as searchRepo.
//
// Unlike a search endpoint, this one has no `total_count` in its body - the `Link` response
// header is the only pagination signal, so the total shown to TablePagination is an ESTIMATE
// from its `last` page number (page * perPage), not an exact count. It also doesn't account for
// PRs sharing pages with issues, so a given UI page can legitimately render fewer than
// `perPage` rows once those are filtered out.
export async function getIssues({ owner, name, state, label, page = 1, perPage = 10, signal }: GetIssuesParams): Promise<GetIssuesResult> {
    const { data, response } = await apiFetch<GithubIssue[]>({
        path: `repos/${owner}/${name}/issues`,
        query: { state, labels: label, page, per_page: perPage },
        signal,
    })

    const items = data.filter((issue) => !isPullRequest(issue)).map(mapIssue)

    const links = parseLinkHeader(response.headers.get('link'))
    const lastPage = links.last ? Number(new URL(links.last).searchParams.get('page')) : null
    const totalCount = lastPage ? lastPage * perPage : (page - 1) * perPage + items.length

    return { items, totalCount }
}
