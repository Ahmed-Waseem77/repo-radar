// Raw GitHub REST API response shapes - kept close to what the API actually returns (only the
// fields we read), separate from our own RepoOverviewDto so a schema change on GitHub's side
// doesn't ripple into the UI layer directly. See mappers.ts for the translation between the two.

export interface GithubOwner {
    login: string
    id: number
    avatar_url: string
    html_url: string
    type: string
}

export interface GithubLicense {
    key: string
    name: string
    spdx_id: string | null
    url: string | null
}

// shared by GET /repos/{owner}/{repo} and each item of GET /search/repositories
export interface GithubRepo {
    id: number
    name: string
    full_name: string
    owner: GithubOwner
    description: string | null
    html_url: string
    homepage: string | null
    language: string | null
    stargazers_count: number
    forks_count: number
    open_issues_count: number
    topics?: string[]
    archived: boolean
    pushed_at: string
    updated_at: string
    created_at: string
    default_branch: string
    license: GithubLicense | null
}

export interface GithubSearchReposResponse {
    total_count: number
    incomplete_results: boolean
    items: GithubRepo[]
}

// GET /repos/{owner}/{repo}/commits?per_page=1 - only the fields we actually read
export interface GithubCommit {
    sha: string
    html_url: string
    commit: {
        message: string
        author: {
            name: string
            date: string
        } | null
    }
    // the linked GitHub account, distinct from commit.author (raw git identity, name/date only) -
    // null when the commit isn't linked to an account, in which case there's no profile to link to
    author: {
        login: string
        html_url: string
    } | null
}

// GET /repos/{owner}/{repo}/languages - language name -> bytes of code written in it
export type GithubLanguages = Record<string, number>

// GET /repos/{owner}/{repo}/releases/latest - only the fields we actually read. GitHub 404s
// this endpoint for a repo with no (non-draft, non-prerelease) release - see getLatestRelease.
export interface GithubRelease {
    tag_name: string
    name: string | null
    html_url: string
}

// GET /repos/{owner}/{repo}/readme - GitHub 404s this for a repo with no README at its root -
// see getReadme. `content` is base64, chunked into 60-char lines (hence the newlines in it).
export interface GithubReadme {
    content: string
    encoding: string
}

export interface GithubIssueLabel {
    name: string
    color: string
}

// GET /repos/{owner}/{repo}/issues - only the fields we actually read. GitHub's REST API
// considers every pull request an issue (but not every issue a pull request), so this endpoint's
// response is a mix of both - `pull_request` is present (see getIssues' isPullRequest) only on
// the items that are actually PRs. Its own `id` there is an ISSUE id, not that PR's real id -
// getting the real one would need the separate "List pull requests" endpoint, which isn't needed
// here since nothing beyond what's already on this response is read.
export interface GithubIssue {
    id: number
    number: number
    title: string
    state: 'open' | 'closed'
    html_url: string
    comments: number
    created_at: string
    user: GithubOwner | null
    labels: GithubIssueLabel[]
    pull_request?: {
        html_url: string | null
        merged_at: string | null
    }
}

// GET /repos/{owner}/{repo}/labels - only the fields we actually read
export interface GithubLabel {
    name: string
    color: string
}

// GET /repos/{owner}/{repo}/stargazers/history - one calendar week's worth of star activity.
// `week` is Unix seconds for the start of that week; `days` (Sunday-start, unused here) is the
// same week's total broken down per day - see getStarHistory.
export interface GithubStarHistoryWeek {
    week: number
    total: number
    days: number[]
}
