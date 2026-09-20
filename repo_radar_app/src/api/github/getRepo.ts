import { apiFetch } from '../client'
import { fetchRepoExtras } from './fetchRepoExtras'
import { mapGithubRepoToDto } from './mappers'
import type { RepoDto } from './mappers'
import type { GithubRepo } from './types'

export interface GetRepoParams {
    owner: string
    name: string
    signal?: AbortSignal
}

// GET /repos/{owner}/{repo} - a single repository by owner + name.
export async function getRepo({ owner, name, signal }: GetRepoParams): Promise<RepoDto> {
    const [repo, extras] = await Promise.all([
        apiFetch<GithubRepo>({ path: `repos/${owner}/${name}`, signal }),
        fetchRepoExtras(owner, name, signal),
    ])

    return mapGithubRepoToDto(repo.data, extras)
}
