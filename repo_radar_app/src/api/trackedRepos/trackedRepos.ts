import { getRepoKey } from '@radar-repo/radar-repo-lib'
import type { RepoDto } from '../github/mappers'
import type { TrackedRepo } from './types'

// bumped if the persisted shape ever changes incompatibly - lets a future version detect and
// discard/migrate old data instead of crashing on a shape mismatch. Bumped to v2 for the
// owner/title composite key below (v1 data keyed purely by title, which collides across owners).
const STORAGE_KEY = 'repo-radar:tracked-repos:v2'

// Every function here is async even though localStorage itself is synchronous. That's
// deliberate: it keeps this module's call signatures identical to whatever a future cloud-backed
// implementation would need (a real network request), so swapping the storage backend later is
// an internal change to this file, not a ripple through every caller/hook built on top of it.

function readAll(): TrackedRepo[] {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TrackedRepo[]
}

function writeAll(repos: TrackedRepo[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos))
}

export async function getTrackedRepos(): Promise<TrackedRepo[]> {
    return readAll()
}

// keyed by owner/title (see getRepoKey) rather than title alone, since two repos under
// different owners can share a name - the caller computes the key via getRepoKey too, so this
// module never needs to know RepoDto's exact shape beyond what getRepoKey itself needs.
export async function isTracked(repoKey: string): Promise<boolean> {
    return readAll().some((repo) => getRepoKey(repo) === repoKey)
}

export async function trackRepo(repo: RepoDto): Promise<void> {
    const repos = readAll()
    const key = getRepoKey(repo)
    if (repos.some((existing) => getRepoKey(existing) === key)) return
    writeAll([...repos, { ...repo, trackedAt: new Date().toISOString() }])
}

export async function untrackRepo(repoKey: string): Promise<void> {
    writeAll(readAll().filter((repo) => getRepoKey(repo) !== repoKey))
}
