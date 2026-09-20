import { apiFetch, ApiError } from '../client'
import { mapCommitToLastCommit, mapLanguagesToLanguageInfo } from './mappers'
import type { RepoExtras } from './mappers'
import type { GithubCommit, GithubLanguages } from './types'

// GitHub's repo/search schemas don't carry commit history or a language breakdown, so a fully
// populated RepoDto needs two extra calls per repo. Shared so getRepo and searchRepo enrich the
// same way - note searchRepo calls this once per result row, so a page of N results costs 1 + 2N
// requests total.
export async function fetchRepoExtras(owner: string, name: string, signal?: AbortSignal): Promise<RepoExtras> {
    const [commits, languages] = await Promise.all([
        // GitHub 409s this endpoint (rather than returning an empty array) for a repo with no
        // commit history yet - a legitimate, fairly common state (a freshly-created repo can
        // easily surface in search results), not a real failure. Treated as "no commit to show"
        // instead of propagating, so it doesn't take the rest of this repo's data down with it.
        apiFetch<GithubCommit[]>({ path: `repos/${owner}/${name}/commits`, query: { per_page: 1 }, signal }).catch(
            (error: unknown) => {
                if (error instanceof ApiError && error.status === 409) return null
                throw error
            },
        ),
        apiFetch<GithubLanguages>({ path: `repos/${owner}/${name}/languages`, signal }),
    ])

    const latestCommit = commits?.data[0]

    return {
        lastCommit: latestCommit ? mapCommitToLastCommit(latestCommit) : null,
        languageInfo: mapLanguagesToLanguageInfo(languages.data),
    }
}
