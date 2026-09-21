import { apiFetch } from '../client'
import type { GithubLabel } from './types'

export interface LabelDto {
    name: string
    color: string
}

export interface GetLabelsParams {
    owner: string
    name: string
    signal?: AbortSignal
}

// GET /repos/{owner}/{repo}/labels - just enough to populate the issues tab's label filter (and
// to decide whether to show it at all - a repo with none defined shouldn't get an empty
// dropdown). per_page:100 covers the overwhelming majority of repos' label sets in one request;
// this is a filter menu, not something that needs exhaustive pagination.
export async function getLabels({ owner, name, signal }: GetLabelsParams): Promise<LabelDto[]> {
    const { data } = await apiFetch<GithubLabel[]>({
        path: `repos/${owner}/${name}/labels`,
        query: { per_page: 100 },
        signal,
    })
    return data
}
