import type { LanguageInfo } from '../../types/repo.ts'
import { Box, Typography, Stack } from '@mui/material'
import { emphasize } from '@mui/material/styles'
import { normalizeDistribution, indexedColor } from '../../util'

export interface LanguageDistributionBarProps extends LanguageInfo {
    height: 'sm' | 'md' | 'lg'
    // caps the rendered width of the bar (and its labels) - languages is otherwise
    // allowed to grow as wide as its parent
    maxWidth?: number | string
    // only the top N languages by distribution are shown (the rest are dropped, and
    // the shown ones are renormalized to 100% of just that subset) - omit to show all
    languageCutoff?: number
    // 'aligned' (default): each language's caption sits under its own bar segment,
    // sized to match that segment's width - reads poorly once segments get narrow.
    // 'inline': one single noWrap line listing every shown language instead, not tied
    // to individual segment widths.
    labelLayout?: 'aligned' | 'inline'
}

const heightMapper = (height: LanguageDistributionBarProps['height']) => {
    if (height === 'md') return 20;
    if (height === 'lg') return 30;
    return 10; // sm
}

export default function LanguageDistributionBar({
    height,
    maxWidth,
    languageCutoff,
    labelLayout = 'aligned',
    ...info
}: LanguageDistributionBarProps) {
    if (info.languages.length === 0) {
        return (
            <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, maxWidth }}>
                <Box
                    sx={{
                        width: '100%',
                        height: heightMapper(height),
                        borderRadius: 1,
                        bgcolor: 'action.disabledBackground',
                    }}
                />
                <Typography variant="body2" color="text.secondary">
                    No languages available
                </Typography>
            </Stack>
        )
    }

    // keep only the top `languageCutoff` languages by raw distribution value, then let
    // normalizeDistribution scale just that subset back up to 100%
    const ranked = info.languages
        .map((language, i) => ({ language, value: info.distribution[i] ?? 0 }))
        .sort((a, b) => b.value - a.value)
    const shown = languageCutoff !== undefined ? ranked.slice(0, languageCutoff) : ranked

    const normalized = normalizeDistribution({
        languages: shown.map((entry) => entry.language),
        distribution: shown.map((entry) => entry.value),
    })

    return (
        <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, maxWidth }}>
            <Stack direction="row" spacing={1} sx={{ width: '100%', minWidth: 0 }}>
                {normalized.languages.map((language, i) => (
                    <Stack
                        key={language}
                        direction="column"
                        // flex-grow proportional to this language's share, so the row's
                        // total width is always exactly the parent's width, never more -
                        // flexBasis 0 means that share, not the content, drives the width
                        sx={{ flex: `${normalized.distribution[i] || 1} 0 0%`, minWidth: 0 }}
                    >
                        <Box
                            sx={[
                                (theme) => {
                                    const { light, dark } = indexedColor(language, i)
                                    return {
                                        width: '100%',
                                        height: heightMapper(height),
                                        borderRadius: 1,
                                        boxShadow: 1,
                                        bgcolor: light,
                                        transition: theme.transitions.create(['height', 'box-shadow']),
                                        ...theme.applyStyles('dark', { bgcolor: dark }),
                                        '&:hover': {
                                            boxShadow: 3,
                                            height: heightMapper(height) + 2,
                                            bgcolor: emphasize(light, 0.2),
                                            ...theme.applyStyles('dark', { bgcolor: emphasize(dark, 0.2) }),
                                        },
                                    }
                                },
                            ]}
                        />
                        {labelLayout === 'aligned' && (
                            <Typography noWrap variant="caption" component="code">
                                {language}: {normalized.distribution[i].toFixed(0)}%
                            </Typography>
                        )}
                    </Stack>
                ))}
            </Stack>
            {labelLayout === 'inline' && (
                <Typography noWrap variant="caption" component="code">
                    {normalized.languages
                        .map((language, i) => `${language}: ${normalized.distribution[i].toFixed(0)}%`)
                        .join('  ')}
                </Typography>
            )}
        </Stack>
    )
}
