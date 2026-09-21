import { useEffect, useState } from 'react'
import { getStarHistory } from '../../api/github/getStarHistory'
import type { StarHistoryPoint } from '../../api/github/getStarHistory'

export interface UseStarHistoryParams {
    owner: string
    name: string
}

export interface UseStarHistoryState {
    // undefined specifically means "not settled yet" - distinct from an empty array, which is a
    // real result (a repo with 0 stars).
    data: StarHistoryPoint[] | undefined
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: StarHistoryPoint[]
    error: Error | null
}

function keyOf(params: UseStarHistoryParams): string {
    return `${params.owner}/${params.name}`
}

// mirrors useIssues' key/settle/abort pattern - params is null when there's nothing to fetch yet
// (e.g. the Star History tab isn't the active one).
export function useStarHistory(params: UseStarHistoryParams | null): UseStarHistoryState {
    const [result, setResult] = useState<Result>({ key: '', data: [], error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getStarHistory({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: [], error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.owner, params?.name])

    if (!params) {
        return { data: undefined, loading: false, error: null }
    }

    const key = keyOf(params)
    const settled = result.key === key

    return {
        data: settled ? result.data : undefined,
        loading: !settled,
        error: settled ? result.error : null,
    }
}
