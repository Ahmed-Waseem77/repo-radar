// below this age there's no real trend to show yet, so the tab is disabled entirely rather than
// rendering a chart of one or two data points
const STAR_HISTORY_MIN_AGE_MONTHS = 1
// [MIN_AGE, ADAPTIVE_CEILING) is a repo old enough to show SOMETHING but younger than the default
// window - the button/title show that shorter, actual period instead of claiming 6 months' worth
// of trend exists when it doesn't (the chart itself would already just show what's actually
// there regardless, this is purely about not mislabeling it)
const STAR_HISTORY_ADAPTIVE_CEILING_MONTHS = 3
const STAR_HISTORY_DEFAULT_PERIOD_MONTHS = 6
const DAYS_PER_MONTH = 30

export interface StarHistoryPeriod {
    disabled: boolean
    months: number
}

// createdAt is optional on RepoDto (see RepoOverviewDto) - missing it (a loading placeholder,
// somewhere that never populated it) is treated as "assume old enough", not as young, since
// disabling the tab or mislabeling its period on missing data would be a worse default.
export function getStarHistoryPeriod(createdAt: string | undefined): StarHistoryPeriod {
    if (!createdAt) return { disabled: false, months: STAR_HISTORY_DEFAULT_PERIOD_MONTHS }

    const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const ageInMonths = Math.floor(ageInDays / DAYS_PER_MONTH)

    if (ageInMonths < STAR_HISTORY_MIN_AGE_MONTHS) return { disabled: true, months: ageInMonths }
    if (ageInMonths < STAR_HISTORY_ADAPTIVE_CEILING_MONTHS) return { disabled: false, months: ageInMonths }
    return { disabled: false, months: STAR_HISTORY_DEFAULT_PERIOD_MONTHS }
}

export function getStarsTabLabel(period: StarHistoryPeriod): string {
    return period.disabled ? 'Repo too Young for Star History' : `Stars (${period.months}mo)`
}
