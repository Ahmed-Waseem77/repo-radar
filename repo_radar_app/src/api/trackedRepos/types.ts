import type { RepoDto } from '../github/mappers'

export interface TrackedRepo extends RepoDto {
    trackedAt: string
}
