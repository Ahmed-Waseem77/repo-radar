import { apiFetch, ApiError } from '../client'
import type { GithubRelease } from './types'

export interface LatestReleaseDto {
    version: string
    url: string
}

export interface GetLatestReleaseParams {
    owner: string
    name: string
    signal?: AbortSignal
}

// GET /repos/{owner}/{repo}/releases/latest - the most recent non-draft, non-prerelease release.
// GitHub 404s this endpoint when the repo has no qualifying release - a legitimate, common state,
// not a real failure, so it's treated as "no release to show" (null) rather than propagating.
export async function getLatestRelease({ owner, name, signal }: GetLatestReleaseParams): Promise<LatestReleaseDto | null> {
    try {
        const { data } = await apiFetch<GithubRelease>({ path: `repos/${owner}/${name}/releases/latest`, signal })
        return { version: data.name?.trim() || data.tag_name, url: data.html_url }
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
    }
}
