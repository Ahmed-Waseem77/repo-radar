import { useEffect, useState } from 'react'
import { getIssues } from '../../api/github/getIssues'
import type { GetIssuesParams, GetIssuesResult } from '../../api/github/getIssues'

export type UseIssuesParams = Omit<GetIssuesParams, 'signal'>

export interface UseIssuesState {
    data: GetIssuesResult | null
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: GetIssuesResult | null
    error: Error | null
}

function keyOf(params: UseIssuesParams): string {
    return [params.owner, params.name, params.state, params.label, params.page, params.perPage].join('|')
}

// mirrors useSearchRepo's key/settle/abort pattern - params is null when there's nothing to
// fetch yet (e.g. the issues tab isn't the active one), the hook stays idle instead of firing a
// request. Re-fetches whenever owner/name/state/label/page/perPage change.
export function useIssues(params: UseIssuesParams | null): UseIssuesState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getIssues({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by the next effect run isn't a real error
                if (controller.signal.aborted) return
                setResult({ key, data: null, error })
            })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params?.owner, params?.name, params?.state, params?.label, params?.page, params?.perPage])

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
