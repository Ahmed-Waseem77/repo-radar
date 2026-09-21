import { apiFetch } from '../client'
import type { GithubStarHistoryWeek } from './types'

export interface StarHistoryPoint {
    // ISO date - the start of that calendar week
    date: string
    // stars gained DURING that week - a weekly rate, not a running cumulative total
    starsGained: number
}

export interface GetStarHistoryParams {
    owner: string
    name: string
    signal?: AbortSignal
}

// ~6 months, and comfortably within this endpoint's own per_page max (30) - one request instead
// of a multi-page walk. Walking a repo's ENTIRE lifetime is what made this slow for an old repo
// (dozens of requests) while barely showing anything for a young one (a handful of weeks either
// way) - the last 6 months is fast for any repo's age and, as a recent trend, is the more useful
// thing to show for both ends of that spectrum.
const WEEKS_IN_SIX_MONTHS = 26

// GET /repos/{owner}/{repo}/stargazers/history - weekly star counts, most-recent-week-first (see
// GithubStarHistoryWeek). Reversed to chronological order so the chart reads left-to-right.
export async function getStarHistory({ owner, name, signal }: GetStarHistoryParams): Promise<StarHistoryPoint[]> {
    const { data } = await apiFetch<GithubStarHistoryWeek[]>({
        path: `repos/${owner}/${name}/stargazers/history`,
        query: { page: 1, per_page: WEEKS_IN_SIX_MONTHS },
        signal,
    })

    return data
        .map((week) => ({ date: new Date(week.week * 1000).toISOString(), starsGained: week.total }))
        .reverse()
}
