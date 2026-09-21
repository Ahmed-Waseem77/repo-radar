import { useEffect, useState } from 'react'
import { getLabels } from '../../api/github/getLabels'
import type { LabelDto } from '../../api/github/getLabels'

export interface UseLabelsParams {
    owner: string
    name: string
}

export interface UseLabelsState {
    // undefined specifically means "not settled yet" - once settled, an empty array is a real,
    // meaningful result (the repo genuinely defines no labels), not a loading/error stand-in.
    data: LabelDto[] | undefined
    loading: boolean
    error: Error | null
}

interface Result {
    key: string
    data: LabelDto[]
    error: Error | null
}

function keyOf(params: UseLabelsParams): string {
    return `${params.owner}/${params.name}`
}

// mirrors useLatestRelease's key/settle/abort pattern - params is null when there's nothing to
// fetch yet, the hook stays idle instead of firing a request.
export function useLabels(params: UseLabelsParams | null): UseLabelsState {
    const [result, setResult] = useState<Result>({ key: '', data: [], error: null })

    useEffect(() => {
        if (!params) return

        const controller = new AbortController()
        const key = keyOf(params)

        getLabels({ ...params, signal: controller.signal })
            .then((data) => setResult({ key, data, error: null }))
            .catch((error: Error) => {
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
