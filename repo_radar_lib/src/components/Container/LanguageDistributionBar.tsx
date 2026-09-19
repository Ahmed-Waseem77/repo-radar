import type { LanguageInfo } from '../../types/repo.ts'
import { Box, Typography, Stack } from '@mui/material'
import { emphasize } from '@mui/material/styles'
import { normalizeDistribution, themedRandomColor } from '../../util'

export interface LanguageDistributionBarProps extends LanguageInfo {
    height: 'sm' | 'md' | 'lg'
}

const heightMapper = (height: LanguageDistributionBarProps['height']) => {
    if (height === 'md') return 20;
    if (height === 'lg') return 30;
    return 10; // sm
}

export default function LanguageDistributionBar({ height, ...info }: LanguageDistributionBarProps) {
    if (info.languages.length === 0) {
        return (
            <Stack direction="column" spacing={0.5} sx={{ minWidth: 0 }}>
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

    const normalized = normalizeDistribution(info)

    return (
        <Stack direction="row" spacing={1} sx={{ width: '100%', minWidth: 0 }}>
            {info.languages.map((language, i) => (
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
                                const { light, dark } = themedRandomColor(theme, language)
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
                    <Typography noWrap variant="caption" component="code">
                        {language}: {normalized.distribution[i].toFixed(0)}%
                    </Typography>
                </Stack>
            ))}
        </Stack>
    )
}
