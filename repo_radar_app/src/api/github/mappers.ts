import type { LastCommit, LanguageInfo, RepoOverviewDto } from '@radar-repo/radar-repo-lib'
import type { GithubCommit, GithubLanguages, GithubRepo } from './types'

// RepoOverviewDto bakes in onTrack/onDetailedView UI callbacks that the data layer has no way
// to produce - the app composes those in at render time, this is what a mapper can actually give it.
export type RepoDto = Omit<RepoOverviewDto, 'onTrack' | 'onDetailedView'>

export function mapCommitToLastCommit(commit: GithubCommit): LastCommit {
    return {
        hash: commit.sha,
        description: commit.commit.message.split('\n')[0],
        date: commit.commit.author?.date ?? '',
        developerName: commit.author?.login ?? commit.commit.author?.name ?? 'unknown',
    }
}

export function mapLanguagesToLanguageInfo(languages: GithubLanguages): LanguageInfo {
    const entries = Object.entries(languages)
    return {
        languages: entries.map(([name]) => name),
        // raw byte counts - LanguageDistributionBar normalizes these into percentages itself
        distribution: entries.map(([, bytes]) => bytes),
    }
}

export interface RepoExtras {
    lastCommit: LastCommit
    languageInfo: LanguageInfo
}

export function mapGithubRepoToDto(repo: GithubRepo, extras: RepoExtras): RepoDto {
    return {
        title: repo.name,
        description: repo.description ?? '',
        lastCommit: extras.lastCommit,
        starCount: repo.stargazers_count,
        languageInfo: extras.languageInfo,
        topics: repo.topics ?? [],
        archived: repo.archived,
        // GitHub's REST API doesn't expose when a repo was archived, so this stays unset rather
        // than guessing from e.g. updated_at.
        archivalDate: undefined,
        // prefer the SPDX id (e.g. "MIT") when GitHub could confidently detect one; "NOASSERTION"
        // means it found a LICENSE file but couldn't match it to a known license, so fall back to
        // the license's own name in that case. null/no license -> renders the "Unlicensed" pill.
        license: repo.license
            ? repo.license.spdx_id && repo.license.spdx_id !== 'NOASSERTION'
                ? repo.license.spdx_id
                : repo.license.name
            : null,
    }
}
