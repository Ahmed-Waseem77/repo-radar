import { searchRepo } from './searchRepo'
import type { SearchRepoResult } from './searchRepo'

export interface GetTrendingReposParams {
    signal?: AbortSignal
}

export const TRENDING_REPO_COUNT = 10

function threeMonthsAgoISODate(): string {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    return date.toISOString().slice(0, 10) // YYYY-MM-DD, what GitHub's `created:` qualifier expects
}

// repos created in the last 3 months, ranked by stars - a fixed, canned searchRepo query rather
// than a new network call: GitHub's search API already takes the date range as part of `q`
// (created:>YYYY-MM-DD) and sort/order as separate params, exactly what searchRepo sends.
export async function getTrendingRepos({ signal }: GetTrendingReposParams = {}): Promise<SearchRepoResult> {
    return searchRepo({
        query: `created:>${threeMonthsAgoISODate()}`,
        sort: 'stars',
        order: 'desc',
        perPage: TRENDING_REPO_COUNT,
        page: 1,
        signal,
    })
}
