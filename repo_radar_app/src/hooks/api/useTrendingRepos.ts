import { useEffect, useState } from 'react'
import { getTrendingRepos } from '../../api/github/trendingRepos'
import type { SearchRepoResult } from '../../api/github/searchRepo'

export interface UseTrendingReposState {
    data: SearchRepoResult | null
    loading: boolean
    error: Error | null
}

// fetches once on mount - unlike useSearchRepo/useGetRepo, trending repos aren't driven by any
// changing input, so there's no params-key comparison needed, and `loading` can just be plain
// state here (nothing sets it synchronously inside the effect body - only the async callbacks do).
export function useTrendingRepos(): UseTrendingReposState {
    const [state, setState] = useState<UseTrendingReposState>({ data: null, loading: true, error: null })

    useEffect(() => {
        const controller = new AbortController()

        getTrendingRepos({ signal: controller.signal })
            .then((data) => setState({ data, loading: false, error: null }))
            .catch((error: Error) => {
                // a stale request being aborted by unmount isn't a real error
                if (controller.signal.aborted) return
                setState({ data: null, loading: false, error })
            })

        return () => controller.abort()
    }, [])

    return state
}
