import type { LanguageInfo } from '../types/repo.ts'

// util function to find max value, and get percentages
export function normalizeDistribution(info: LanguageInfo): LanguageInfo {
    const total = info.distribution.reduce((acc, num) => acc + num, 0);
    // total is 0 when every value is 0, and -Infinity when distribution is empty -
    // either way there's nothing to scale against, so fall back to all-zero widths
    if (!total || !Number.isFinite(total)) {
        return {
            languages: info.languages,
            distribution: info.distribution.map(() => 0),
        };
    }
    return {
        languages: info.languages,
        distribution: info.distribution.map((num) => (num / total) * 100),
    };
}
