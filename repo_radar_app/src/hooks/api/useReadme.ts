import { useEffect, useState } from 'react'
import { getReadme } from '../../api/github/getReadme'

export interface UseReadmeParams {
    owner: string
    name: string
}

export interface UseReadmeState {
    // undefined specifically means "not settled yet" - distinct from `null`, which getReadme
    // returns once settled to mean "confirmed no README" (a 404).
    data: string | null | undefined
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: string | null
    error: Error | null
}

function keyOf(params: UseReadmeParams): string {
    return `${params.owner}/${params.name}`
}

// mirrors useLatestRelease's key/settle/abort pattern - params is null when there's nothing to
// fetch yet (e.g. the README tab isn't the active one), the hook stays idle instead of firing a request.
export function useReadme(params: UseReadmeParams | null): UseReadmeState {
    const [result, setResult] = useState<Result>({ key: '', data: null, error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getReadme({ ...params, signal: controller.signal })
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
