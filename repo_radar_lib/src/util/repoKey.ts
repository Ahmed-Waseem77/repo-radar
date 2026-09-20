import type { RepoOverviewDto } from '../types'

// `title` alone collides across owners (two different repos can share a name) - this is the
// one place "what uniquely identifies a repo" is defined, reused for React list keys, tracked-
// repo set membership, and localStorage lookups alike so it can't drift between call sites.
export function getRepoKey(repo: Pick<RepoOverviewDto, 'owner' | 'title'>): string {
    return `${repo.owner}/${repo.title}`
}
