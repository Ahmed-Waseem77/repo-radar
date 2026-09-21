import { useEffect, useState } from 'react'
import { getLatestRelease } from '../../api/github/getLatestRelease'
import type { LatestReleaseDto } from '../../api/github/getLatestRelease'

export interface UseLatestReleaseParams {
    owner: string
    name: string
}

export interface UseLatestReleaseState {
    // undefined specifically means "not settled yet" - distinct from `null`, which
    // getLatestRelease returns once settled to mean "confirmed no release" (a 404). RepoOverview's
    // `latestRelease` prop relies on telling these apart to show its loading badge correctly.
    data: LatestReleaseDto | null | undefined
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: LatestReleaseDto | null
    error: Error | null
}

function keyOf(params: UseLatestReleaseParams): string {
    return `${params.owner}/${params.name}`
}

// mirrors useGetRepo's key/settle/abort pattern - params is null when there's no repo selected
// yet, the hook stays idle instead of firing a request.
export function useLatestRelease(params: UseLatestReleaseParams | null): UseLatestReleaseState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getLatestRelease({ ...params, signal: controller.signal })
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
