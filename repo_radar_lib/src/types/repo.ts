// TODO: change dates across interfaces to an actual container handling dates

export interface LastCommit {
    hash: string,
    description?: string,
    date: string,
    developerName: string
}

export interface LanguageInfo {
    languages: string[];
    distribution: number[];
}

export interface RepoOverviewDto {
    title: string,
    description: string,
    lastCommit: LastCommit,
    starCount: number,
    languageInfo: LanguageInfo,
    topics: string[],
    onTrack: (event: React.MouseEvent<HTMLButtonElement>) => void,
    onDetailedView: (event: React.SyntheticEvent<HTMLElement>) => void,
    archived: boolean,
    archivalDate?: string
}
