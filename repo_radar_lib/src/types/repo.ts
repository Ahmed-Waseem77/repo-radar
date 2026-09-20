// TODO: change dates across interfaces to an actual container handling dates

export interface LastCommit {
    hash: string,
    description?: string,
    date: string,
    developerName: string,
    url: string,
    // GitHub omits this when the commit isn't linked to a GitHub account - render
    // developerName as plain text (no link) when this is absent
    authorUrl?: string
}

export interface LanguageInfo {
    languages: string[];
    distribution: number[];
}

export interface RepoOverviewDto {
    title: string,
    // GitHub login of the repo's owner - shown as its own caption under the title, and part of
    // the owner/title composite identity key (see util/repoKey.ts) since title alone collides
    // across owners
    owner: string,
    url: string,
    ownerUrl: string,
    description: string,
    // null when the commit lookup failed for this specific repo (e.g. GitHub 409s the commits
    // endpoint for an empty/no-history repo) - the rest of this DTO still comes straight from
    // the search/list response and is unaffected, so only the commit section needs to degrade
    lastCommit: LastCommit | null,
    starCount: number,
    languageInfo: LanguageInfo,
    topics: string[],
    // license name/SPDX id - null/undefined renders an "Unlicensed" pill
    license?: string | null,
    onTrack: (event: React.MouseEvent<HTMLButtonElement>) => void,
    onDetailedView: (event: React.SyntheticEvent<HTMLElement>) => void,
    archived: boolean,
    archivalDate?: string
}
