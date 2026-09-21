import { useEffect, useState } from 'react'
import { getPullRequests } from '../../api/github/getPullRequests'
import type { GetPullRequestsParams, GetPullRequestsResult } from '../../api/github/getPullRequests'

export type UsePullRequestsParams = Omit<GetPullRequestsParams, 'signal'>

export interface UsePullRequestsState {
    data: GetPullRequestsResult | null
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: GetPullRequestsResult | null
    error: Error | null
}

function keyOf(params: UsePullRequestsParams): string {
    return [params.owner, params.name, params.state, params.page, params.perPage].join('|')
}

// mirrors useIssues' key/settle/abort pattern exactly - a separate hook (rather than the same one
// with a "kind" flag) since it fetches independently, see getPullRequests for why.
export function usePullRequests(params: UsePullRequestsParams | null): UsePullRequestsState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getPullRequests({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: null, error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.owner, params?.name, params?.state, params?.page, params?.perPage])

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
