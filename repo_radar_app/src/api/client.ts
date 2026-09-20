// Pure network layer - knows how to build a GitHub REST API request, attach the right headers,
// and surface pagination/rate-limit information from the response. No GitHub-schema-specific
// shapes live here; see api/github/ for those and the mapping into our own DTOs.

export const GITHUB_API_URL = 'https://api.github.com/'

// GitHub versions its REST API by date - bump this if we want to opt into a newer version.
// https://docs.github.com/en/rest/about-the-rest-api/api-versions
const GITHUB_API_VERSION = '2026-03-10'

export type QueryParams = Record<string, string | number | boolean | undefined>

export interface ApiFetchParams {
    path: string
    query?: QueryParams
    signal?: AbortSignal
}

export interface ApiResponse<T> {
    data: T
    response: Response
}

export class ApiError extends Error {
    status: number
    response: Response

    constructor(message: string, status: number, response: Response) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.response = response
    }
}

export class RateLimitError extends ApiError {
    resetAt: Date | null

    constructor(message: string, status: number, response: Response, resetAt: Date | null) {
        super(message, status, response)
        this.name = 'RateLimitError'
        this.resetAt = resetAt
    }
}

function buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(path, GITHUB_API_URL)
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value))
            }
        }
    }
    return url.toString()
}

// parses the `Link` response header GitHub uses to point at adjacent pages, e.g.:
// <https://api.github.com/search/repositories?q=x&page=2>; rel="next", <...>; rel="last"
// https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api
export function parseLinkHeader(header: string | null): Partial<Record<'next' | 'prev' | 'first' | 'last', string>> {
    if (!header) return {}
    const links: Partial<Record<'next' | 'prev' | 'first' | 'last', string>> = {}
    for (const part of header.split(',')) {
        const match = part.match(/<([^>]+)>;\s*rel="(\w+)"/)
        if (!match) continue
        const [, url, rel] = match
        if (rel === 'next' || rel === 'prev' || rel === 'first' || rel === 'last') {
            links[rel] = url
        }
    }
    return links
}

export async function apiFetch<T>({ path, query, signal }: ApiFetchParams): Promise<ApiResponse<T>> {
    const url = buildUrl(path, query)
    const token = import.meta.env.VITE_GITHUB_TOKEN

    const response = await fetch(url, {
        signal,
        headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': GITHUB_API_VERSION,
            // raises the rate limit from GitHub's unauthenticated caps (60/hr core, 10/min
            // search) to an authenticated user's own limits - falls back to unauthenticated
            // requests when VITE_GITHUB_TOKEN isn't set.
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
            const remaining = response.headers.get('x-ratelimit-remaining')
            if (remaining === '0') {
                const resetHeader = response.headers.get('x-ratelimit-reset')
                const resetAt = resetHeader ? new Date(Number(resetHeader) * 1000) : null
                throw new RateLimitError('GitHub API rate limit exceeded', response.status, response, resetAt)
            }
        }
        throw new ApiError(`Request to ${url} failed with status ${response.status}`, response.status, response)
    }

    const data = (await response.json()) as T
    return { data, response }
}
