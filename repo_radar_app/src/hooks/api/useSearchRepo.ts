import { useEffect, useState } from 'react'
import { searchRepo } from '../../api/github/searchRepo'
import type { SearchRepoParams, SearchRepoResult } from '../../api/github/searchRepo'

export type UseSearchRepoParams = Omit<SearchRepoParams, 'signal'>

export interface UseSearchRepoState {
    data: SearchRepoResult | null
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: SearchRepoResult | null
    error: Error | null
}

function keyOf(params: UseSearchRepoParams): string {
    return [params.query, params.page, params.perPage, params.sort, params.order].join('|')
}

// params is null when there's nothing to search yet (e.g. an empty query) - the hook stays idle
// instead of firing a request. `loading` is derived by comparing the last-settled request's key
// against the current params at render time, rather than set synchronously at the top of the
// effect below - that pattern trips react-hooks/set-state-in-effect, since setState should only
// fire from the async searchRepo callbacks, not unconditionally in the effect body itself.
// Re-fetches whenever query/page/perPage/sort/order change, so callers drive pagination by
// changing `page`.
export function useSearchRepo(params: UseSearchRepoParams | null): UseSearchRepoState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        searchRepo({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: null, error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.query, params?.page, params?.perPage, params?.sort, params?.order])

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
