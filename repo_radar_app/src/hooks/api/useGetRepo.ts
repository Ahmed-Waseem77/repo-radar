import { useEffect, useState } from 'react'
import { getRepo } from '../../api/github/getRepo'
import type { RepoDto } from '../../api/github/mappers'

export interface UseGetRepoParams {
    owner: string
    name: string
    // bump to force a fresh fetch even though owner/name haven't changed - e.g. a manual refresh
    // button (RepoDetailPage). Irrelevant to callers that never need one; the key/effect below
    // just fold it in when present.
    refreshToken?: number
}

export interface UseGetRepoState {
    data: RepoDto | null
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: RepoDto | null
    error: Error | null
}

function keyOf(params: UseGetRepoParams): string {
    return `${params.owner}/${params.name}/${params.refreshToken ?? 0}`
}

// params is null when there's no repo to load yet - the hook stays idle instead of firing a
// request. `loading` is derived by comparing the last-settled request's key against the current
// params at render time, rather than set synchronously at the top of the effect below - that
// pattern trips react-hooks/set-state-in-effect, since setState should only fire from the async
// getRepo callbacks, not unconditionally in the effect body itself.
export function useGetRepo(params: UseGetRepoParams | null): UseGetRepoState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getRepo({ owner: params.owner, name: params.name, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: null, error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.owner, params?.name, params?.refreshToken])

    if (!params) {
        return { data: null, loading: false, error: null }
    }

    const key = keyOf(params)
    const settled = result.key === key

    return {
        data: settled ? result.data : null,
        loading: !settled,
        error: settled ? result.error : null,
    }
}
