import { apiFetch } from '../client'
import { mapCommitToLastCommit, mapLanguagesToLanguageInfo } from './mappers'
import type { RepoExtras } from './mappers'
import type { GithubCommit, GithubLanguages } from './types'

// GitHub's repo/search schemas don't carry commit history or a language breakdown, so a fully
// populated RepoDto needs two extra calls per repo. Shared so getRepo and searchRepo enrich the
// same way - note searchRepo calls this once per result row, so a page of N results costs 1 + 2N
// requests total.
export async function fetchRepoExtras(owner: string, name: string, signal?: AbortSignal): Promise<RepoExtras> {
    const [commits, languages] = await Promise.all([
        apiFetch<GithubCommit[]>({ path: `repos/${owner}/${name}/commits`, query: { per_page: 1 }, signal }),
        apiFetch<GithubLanguages>({ path: `repos/${owner}/${name}/languages`, signal }),
    ])

    const [latestCommit] = commits.data

    return {
        lastCommit: latestCommit ? mapCommitToLastCommit(latestCommit) : { hash: '', date: '', developerName: '', url: '' },
        languageInfo: mapLanguagesToLanguageInfo(languages.data),
    }
}
