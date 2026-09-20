import { useEffect, useState } from 'react'
import { getRepo } from '../../api/github/getRepo'
import type { RepoDto } from '../../api/github/mappers'

export interface UseGetRepoParams {
    owner: string
    name: string
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
    return `${params.owner}/${params.name}`
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

        getRepo({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: null, error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.owner, params?.name])

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
