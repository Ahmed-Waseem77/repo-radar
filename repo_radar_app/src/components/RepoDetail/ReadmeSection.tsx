import { Box, Skeleton, Stack, Table, TableCell, Typography } from '@mui/material'
import { useColorScheme, useTheme } from '@mui/material/styles'
import { EmptyState, InlineCode } from '@radar-repo/radar-repo-lib'
import { MuiMarkdown, getOverrides } from 'mui-markdown'
import type { Overrides } from 'mui-markdown'
import { Highlight, themes as prismThemes } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'
import { useReadme } from '../../hooks/api'

// Atom One's dark/light pair - both read as neutral, cool-toned code editor chrome that doesn't
// fight the app's own green/rust accent palette (unlike e.g. Gruvbox's warm cream/brown, which
// would read as a mismatched, differently-hued card next to our sage/near-black backgrounds).
const READ_ME_PRISM_THEME_LIGHT: PrismTheme = prismThemes.oneLight
const READ_ME_PRISM_THEME_DARK: PrismTheme = prismThemes.oneDark

// mui-markdown's own h1-h6 default to their literal Typography variant (h1..h6) - far too large
// for a nested detail-view panel - and its table has no border at all. getOverrides(...) (rather
// than the static `defaultOverrides`) is what actually wires fenced (```) blocks up to real
// Prism syntax highlighting - it bakes the Highlight/themes/prismTheme options into the `pre`
// mapping it returns, which `defaultOverrides` alone doesn't know about. Everything else (links,
// lists, images, ...) keeps its normal styling. `code` reuses the lib's own InlineCode for a
// genuine inline span only - the highlighted block's own internal rendering never goes through
// the `code` override at all (mui-markdown renders its tokens directly), so there's no risk of
// InlineCode's pill nesting inside the block the way it did before highlighting was added.
// `styles` is merged into the highlighted block's own `<pre>` INLINE style, after (so it wins
// over) the prism theme's own background/text-color style - the one piece of that theme this
// swaps out, without touching its actual token colors.
function buildReadmeOverrides(prismTheme: PrismTheme, codeBlockBackground: string): Overrides {
    return {
        ...getOverrides({
            Highlight,
            themes: prismThemes,
            prismTheme,
            hideLineNumbers: true,
            styles: { backgroundColor: codeBlockBackground },
        }),
        h1: { component: Typography, props: { variant: 'h5', component: 'h1', color: 'primary', sx: { fontWeight: 700 } } },
        h2: { component: Typography, props: { variant: 'h6', component: 'h2', color: 'primary', sx: { fontWeight: 700 } } },
        h3: { component: Typography, props: { variant: 'subtitle1', component: 'h3', color: 'primary', sx: { fontWeight: 700 } } },
        h4: { component: Typography, props: { variant: 'subtitle2', component: 'h4', color: 'primary', sx: { fontWeight: 700 } } },
        h5: { component: Typography, props: { variant: 'body1', component: 'h5', color: 'primary', sx: { fontWeight: 700 } } },
        h6: { component: Typography, props: { variant: 'body2', component: 'h6', color: 'primary', sx: { fontWeight: 700 } } },
        table: { component: Table, props: { sx: { border: '1px solid', borderColor: 'divider', borderCollapse: 'collapse' } } },
        th: { component: TableCell, props: { sx: { border: '1px solid', borderColor: 'divider' } } },
        td: { component: TableCell, props: { sx: { border: '1px solid', borderColor: 'divider' } } },
        code: { component: InlineCode },
    }
}

// only mounted while the README tab is active (see RepoDetailView), which is itself what makes
// this "fetch on click" - useReadme fires its request on mount, not before.
export function ReadmeSection({ owner, name }: { owner: string; name: string }) {
    const { data: readme, loading } = useReadme({ owner, name })
    // mirrors ColorModeToggle's own resolution - mode === 'system' doesn't say which way it's
    // currently resolved, systemMode (only populated in that case) carries the OS-level choice.
    const { mode, systemMode } = useColorScheme()
    const isDark = (mode === 'system' ? systemMode : mode) === 'dark'
    const theme = useTheme()

    if (loading) {
        return (
            <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0, py: 1, px: 1 }}>
                <Skeleton variant="text" width="100%" sx={{ fontSize: '1.75rem' }} />
                <Skeleton variant="text" width="95%" />
                <Skeleton variant="text" width="88%" />
                <Skeleton variant="text" width="92%" />
                <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="60%" />
            </Stack>
        )
    }

    if (!readme) {
        return <EmptyState message="This repository doesn't have a README." sx={{ flex: 1, minHeight: 0, py: 4 }} />
    }

    // a raw CSS value (fed into the highlighted block's own inline `style`, not an sx prop) needs
    // the vars-or-fallback form, same as NotFoundPage's box-shadow color.
    const paperBackground = theme.vars?.palette.background.paper ?? theme.palette.background.paper
    const readmeOverrides = buildReadmeOverrides(isDark ? READ_ME_PRISM_THEME_DARK : READ_ME_PRISM_THEME_LIGHT, paperBackground)

    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 0, py: 2 }}>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden'}}>
                <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" component="code" color="text.secondary">
                        README.md
                    </Typography>
                </Box>
                <Box
                    sx={(theme) => ({
                        px: 3,
                        py: 2.5,
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                            marginTop: theme.spacing(3),
                            marginBottom: theme.spacing(1.5),
                        },
                        // `pre` isn't in this list - the highlighted block below already gets its
                        // own `my: 2` from mui-markdown's own wrapper, adding one here too would
                        // just add extra blank space inside its rounded/bordered card.
                        '& p, & ul, & ol, & table, & blockquote, & hr': {
                            marginTop: 0,
                            marginBottom: theme.spacing(2),
                        },
                        '& li': {
                            marginBottom: theme.spacing(0.5),
                        },
                        '& > *:first-of-type': {
                            marginTop: 0,
                        },
                    })}
                >
                    <MuiMarkdown overrides={readmeOverrides}>{readme}</MuiMarkdown>
                </Box>
            </Box>
        </Box>
    )
}
