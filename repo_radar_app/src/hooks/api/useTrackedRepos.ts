import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRepoKey } from '@radar-repo/radar-repo-lib'
import { getTrackedRepos, trackRepo, untrackRepo } from '../../api/trackedRepos'
import type { TrackedRepo } from '../../api/trackedRepos'
import type { RepoDto } from '../../api/github/mappers'

export interface UseTrackedReposState {
    data: TrackedRepo[]
    trackedKeys: Set<string>
    loading: boolean
    error: Error | null
    track: (repo: RepoDto) => void
    untrack: (repoKey: string) => void
    // toggles based on the repo's own key against the current trackedKeys - the one callers
    // wire up to a card's Track/Untrack button, since it needs the full repo (to persist it if
    // tracking) but only decides which way to go by key.
    toggleTrack: (repo: RepoDto) => void
}

// localStorage today (see api/trackedRepos), but this hook is the only thing the rest of the
// app talks to, so swapping that for a real backend later stays contained to this file plus
// trackedRepos.ts itself.
export function useTrackedRepos(): UseTrackedReposState {
    const [state, setState] = useState<{ data: TrackedRepo[]; loading: boolean; error: Error | null }>({
        data: [],
        loading: true,
        error: null,
    })

    useEffect(() => {
        let cancelled = false
        getTrackedRepos()
            .then((data) => {
                if (!cancelled) setState({ data, loading: false, error: null })
            })
            .catch((error: Error) => {
                if (!cancelled) setState({ data: [], loading: false, error })
            })
        return () => {
            cancelled = true
        }
    }, [])

    const refresh = useCallback(() => {
        getTrackedRepos()
            .then((data) => setState((prev) => ({ ...prev, data, error: null })))
            .catch((error: Error) => setState((prev) => ({ ...prev, error })))
    }, [])

    const track = useCallback(
        (repo: RepoDto) => {
            trackRepo(repo).then(refresh).catch((error: Error) => setState((prev) => ({ ...prev, error })))
        },
        [refresh],
    )

    const untrack = useCallback(
        (repoKey: string) => {
            untrackRepo(repoKey).then(refresh).catch((error: Error) => setState((prev) => ({ ...prev, error })))
        },
        [refresh],
    )

    const trackedKeys = useMemo(() => new Set(state.data.map((repo) => getRepoKey(repo))), [state.data])

    const toggleTrack = useCallback(
        (repo: RepoDto) => {
            if (trackedKeys.has(getRepoKey(repo))) {
                untrack(getRepoKey(repo))
            } else {
                track(repo)
            }
        },
        [trackedKeys, track, untrack],
    )

    return { data: state.data, trackedKeys, loading: state.loading, error: state.error, track, untrack, toggleTrack }
}
