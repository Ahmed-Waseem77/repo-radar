import { apiFetch, ApiError } from '../client'
import type { GithubReadme } from './types'

// GitHub returns README content as base64 - atob alone mangles anything outside Latin1 (emoji,
// accented names, etc.), so this goes through the bytes explicitly and lets TextDecoder do the
// actual UTF-8 decoding.
function decodeBase64Utf8(base64: string): string {
    const binary = atob(base64.replace(/\n/g, ''))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
}

export interface GetReadmeParams {
    owner: string
    name: string
    signal?: AbortSignal
}

// GET /repos/{owner}/{repo}/readme - the repo's root README, decoded from the base64 GitHub
// serves it as. 404s for a repo with no README - a legitimate, common state, not a real failure,
// so it's treated as "no README to show" (null) rather than propagating.
export async function getReadme({ owner, name, signal }: GetReadmeParams): Promise<string | null> {
    try {
        const { data } = await apiFetch<GithubReadme>({ path: `repos/${owner}/${name}/readme`, signal })
        return decodeBase64Utf8(data.content)
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
    }
}
