import type { LastCommit, LanguageInfo, RepoOverviewDto } from '@radar-repo/radar-repo-lib'
import type { GithubCommit, GithubLanguages, GithubRepo } from './types'

// RepoOverviewDto bakes in onTrack/onDetailedView UI callbacks that the data layer has no way
// to produce - the app composes those in at render time, this is what a mapper can actually give it.
export type RepoDto = Omit<RepoOverviewDto, 'onTrack' | 'onDetailedView'>

// GitHub's own UI (and convention generally) shows commits by their short 7-character SHA -
// the full 40-character sha is still what lastCommit.url links to, this is purely the display
// value everywhere lastCommit.hash is rendered.
const SHORT_HASH_LENGTH = 7

export function mapCommitToLastCommit(commit: GithubCommit): LastCommit {
    return {
        hash: commit.sha.slice(0, SHORT_HASH_LENGTH),
        description: commit.commit.message.split('\n')[0],
        date: commit.commit.author?.date ?? '',
        developerName: commit.author?.login ?? commit.commit.author?.name ?? 'unknown',
        url: commit.html_url,
        authorUrl: commit.author?.html_url,
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
        owner: repo.owner.login,
        url: repo.html_url,
        ownerUrl: repo.owner.html_url,
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
