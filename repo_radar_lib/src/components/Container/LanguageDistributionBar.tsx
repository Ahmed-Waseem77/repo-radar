import { useState } from 'react'
import type { LanguageInfo } from '../../types/repo.ts'
import { Box, Typography, Stack } from '@mui/material'
import { emphasize } from '@mui/material/styles'
import { normalizeDistribution, hashedThemeColor } from '../../util'

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
    // 'aligned' gets a stable, non-shrinking width (rather than just a cap) so it doesn't
    // resize as the number of visible segments/captions changes - 'inline' stays flexible
    // since it's meant to wrap within whatever space it's given.
    const widthSx = labelLayout === 'aligned' ? { width: maxWidth } : { maxWidth }

    // tracks which bar segment (by index into normalized.languages) is currently hovered, so
    // the matching entry in the 'inline' summary line can grow/highlight in response - the two
    // live in separate branches of the tree, so this can't be done with CSS hover alone.
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    if (info.languages.length === 0) {
        return (
            <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, ...widthSx }}>
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

    // languages under this share render as slivers too thin to read as a bar segment or line
    // up a caption against - dropped from the colored bar (and its per-segment 'aligned'
    // captions, which are tied 1:1 to a segment) but NOT from the 'inline' summary line below,
    // which is plain text and has no "too thin to parse" problem.
    const BAR_MIN_PERCENT = 2
    const barIndices = normalized.languages
        .map((_, i) => i)
        .filter((i) => normalized.distribution[i] >= BAR_MIN_PERCENT)
    // falls back to always showing the top language so a very fragmented distribution (every
    // language under the floor) never renders a completely blank bar
    const visibleBarIndices = barIndices.length > 0 ? barIndices : normalized.languages.length > 0 ? [0] : []

    // separate, much lower floor for the inline text - it's not fighting for pixel width like
    // the bar segments are, but a language that rounds to "0%" is still meaningless to list
    const visibleInline = normalized.languages
        .map((language, i) => ({ language, i, pct: Math.round(normalized.distribution[i]) }))
        .filter((entry) => entry.pct > 0)

    return (
        <Stack direction="column" spacing={0.5} sx={{ minWidth: 0, ...widthSx }}>
            <Stack direction="row" spacing={1} sx={{ width: '100%', minWidth: 0 }}>
                {visibleBarIndices.map((i) => {
                    const language = normalized.languages[i]
                    return (
                        <Stack
                            key={language}
                            direction="column"
                            // flex-grow proportional to this language's share, so the row's
                            // total width is always exactly the parent's width, never more -
                            // flexBasis 0 means that share, not the content, drives the width
                            sx={{ flex: `${normalized.distribution[i] || 1} 0 0%`, minWidth: 0 }}
                        >
                            <Box
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex((current) => (current === i ? null : current))}
                                sx={[
                                    (theme) => {
                                        const { light, dark } = hashedThemeColor(language)
                                        return {
                                            width: '100%',
                                            height: heightMapper(height),
                                            borderRadius: 1,
                                            boxShadow: 1,
                                            // tonal in both schemes, but with fill/border swapped
                                            // between them: light mode fills with `dark` and borders
                                            // with `light`, dark mode fills with `light` and borders
                                            // with `dark` - each scheme's own hashedThemeColor value
                                            // (picked for contrast against THAT scheme's background)
                                            // ends up as the more prominent (fill) color in its own scheme.
                                            bgcolor: dark,
                                            border: `1px solid ${light}`,
                                            transition: theme.transitions.create(['height', 'box-shadow', 'border-color']),
                                            ...theme.applyStyles('dark', { bgcolor: light, border: `1px solid ${dark}` }),
                                            '&:hover': {
                                                boxShadow: 3,
                                                height: heightMapper(height) + 2,
                                                bgcolor: emphasize(dark, 0.2),
                                                borderColor: emphasize(light, 0.2),
                                                ...theme.applyStyles('dark', {
                                                    bgcolor: emphasize(light, 0.2),
                                                    borderColor: emphasize(dark, 0.2),
                                                }),
                                            },
                                        }
                                    },
                                ]}
                            />
                            {labelLayout === 'aligned' && (
                                <Typography
                                    noWrap
                                    variant="caption"
                                    component="code"
                                    sx={[
                                        (theme) => {
                                            const { light, dark } = hashedThemeColor(language)
                                            return {
                                                transformOrigin: 'left',
                                                transition: theme.transitions.create(['font-size', 'color']),
                                                ...(hoveredIndex === i && {
                                                    fontSize: '14px',
                                                    color: light,
                                                    ...theme.applyStyles('dark', { color: dark }),
                                                }),
                                            }
                                        },
                                    ]}
                                >
                                    {language}: {normalized.distribution[i].toFixed(0)}%
                                </Typography>
                            )}
                        </Stack>
                    )
                })}
            </Stack>
            {labelLayout === 'inline' && (
                <Typography variant="caption" component="code">
                    {visibleInline.map(({ language, i, pct }, idx) => (
                        <Box
                            key={language}
                            component="span"
                            sx={[
                                (theme) => {
                                    const { light, dark } = hashedThemeColor(language)
                                    return {
                                        display: 'inline-block',
                                        // explicit margin instead of relying on literal space
                                        // characters between spans - those get unreliable once a
                                        // sibling's fontSize is growing/shrinking on hover
                                        marginRight: idx < visibleInline.length - 1 ? theme.spacing(1.5) : 0,
                                        transition: theme.transitions.create(['font-size', 'color']),
                                        ...(hoveredIndex === i && {
                                            fontSize: '14px',
                                            color: light,
                                            ...theme.applyStyles('dark', { color: dark }),
                                        }),
                                    }
                                },
                            ]}
                        >
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                                {language}
                            </Box>
                            : {pct}%
                        </Box>
                    ))}
                </Typography>
            )}
        </Stack>
    )
}
