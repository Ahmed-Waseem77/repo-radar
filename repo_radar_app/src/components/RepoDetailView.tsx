import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Box, Button as MuiButton, ButtonGroup as MuiButtonGroup, Skeleton, Table, TableCell, Typography, Stack } from '@mui/material'
import { useColorScheme, useTheme } from '@mui/material/styles'
import { Button, Carousel, getRepoKey, InlineCode, NoSearchIcon, RepoOverview, RepoOverviewCompact } from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps } from '@radar-repo/radar-repo-lib'
import { MuiMarkdown, getOverrides } from 'mui-markdown'
import type { Overrides } from 'mui-markdown'
import { Highlight, themes as prismThemes } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone'
import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone'
import CallMergeTwoToneIcon from '@mui/icons-material/CallMergeTwoTone'
import TimelineTwoToneIcon from '@mui/icons-material/TimelineTwoTone'
import { useLatestRelease, useReadme } from '../hooks/api'
import type { RepoDto } from '../api/github/mappers'

type DetailTab = 'readme' | 'issues' | 'prs' | 'stars'

const TABS: { id: DetailTab; label: string; icon: typeof ArticleTwoToneIcon }[] = [
    { id: 'readme', label: 'README', icon: ArticleTwoToneIcon },
    { id: 'issues', label: 'Issues', icon: BugReportTwoToneIcon },
    { id: 'prs', label: 'Pull Requests', icon: CallMergeTwoToneIcon },
    { id: 'stars', label: 'Star History', icon: TimelineTwoToneIcon },
]

export interface RepoDetailViewProps {
    // the currently-selected repo, shown in full in the top RepoOverview
    repo: RepoDto
    tracked: boolean
    onToggleTrack: (event: MouseEvent<HTMLButtonElement>) => void
    // whatever list the calling page already computed for its own normal rendering - each
    // item's onDetailedView is expected to already be wired by the caller to switch selection
    // (not to open/close this view), so clicking a card here just changes `repo` above
    sidePanelRepos: RepoOverviewCompactProps[]
}

// each of these 4 sections is real follow-up work (README rendering, issues/PRs lists, a star-
// history chart) - out of scope here, this just wires up the tab switcher itself.
function TabPlaceholder({ label }: { label: string }) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
            <NoSearchIcon sx={{ width: 200, height: 'auto' }} />
            <Typography variant="body1" color="textDimmed">{label} coming soon.</Typography>
        </Box>
    )
}

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

// only mounted while the README tab is active (see the render below), which is itself what makes
// this "fetch on click" - useReadme fires its request on mount, not before.
function ReadmeSection({ owner, name }: { owner: string; name: string }) {
    const { data: readme, loading } = useReadme({ owner, name })
    // mirrors ColorModeToggle's own resolution - mode === 'system' doesn't say which way it's
    // currently resolved, systemMode (only populated in that case) carries the OS-level choice.
    const { mode, systemMode } = useColorScheme()
    const isDark = (mode === 'system' ? systemMode : mode) === 'dark'
    const theme = useTheme()

    if (loading) {
        return (
            <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0, py: 3 }}>
                <Skeleton variant="text" width="45%" sx={{ fontSize: '1.75rem' }} />
                <Skeleton variant="text" width="95%" />
                <Skeleton variant="text" width="88%" />
                <Skeleton variant="text" width="92%" />
                <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="85%" />
                <Skeleton variant="text" width="60%" />
            </Stack>
        )
    }

    if (!readme) {
        return (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
                <NoSearchIcon sx={{ width: 200, height: 'auto' }} />
                <Typography variant="body1" color="textDimmed">This repository doesn&apos;t have a README.</Typography>
            </Box>
        )
    }

    // a raw CSS value (fed into the highlighted block's own inline `style`, not an sx prop) needs
    // the vars-or-fallback form, same as NotFoundPage's box-shadow color.
    const paperBackground = theme.vars?.palette.background.paper ?? theme.palette.background.paper
    const readmeOverrides = buildReadmeOverrides(isDark ? READ_ME_PRISM_THEME_DARK : READ_ME_PRISM_THEME_LIGHT, paperBackground)

    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}>
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

// the back-chevron / Escape affordance for closing this view lives in App.tsx's AppBar (start
// slot, before the logo) instead of here - keeps the "how do I close this" answer in one place
// regardless of which page opened it, rather than duplicating a back button per page.
export function RepoDetailView({ repo, tracked, onToggleTrack, sidePanelRepos }: RepoDetailViewProps) {
    const { data: latestRelease } = useLatestRelease({ owner: repo.owner, name: repo.title })
    const [activeTab, setActiveTab] = useState<DetailTab>('readme')
    const activeTabLabel = TABS.find((tab) => tab.id === activeTab)!.label

    return (
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0, maxHeight: '100%', maxWidth: '100%', px: 2, py: 2 }}>
            {/* `width` (a real Carousel prop, not just wrapping it in a sized Box) is required here,
                not optional: this is a 'grid' layout, and a plain CSS `width: fit-content` on a
                wrapping flex container sizes from its UNWRAPPED max-content width (every card side
                by side in one line), not the actually-wrapped rendered width - so it blows out far
                wider than one card. `flexShrink: 0` (set internally whenever `width` is passed) is
                what actually keeps this fixed regardless of how little/much room the row beside it wants. */}
            <Carousel width={300} orientation="vertical" layout="grid" autoScroll={false} gutter={2} divider>
                {sidePanelRepos.map((sidePanelRepo) => {
                    const isSelected = getRepoKey(sidePanelRepo) === getRepoKey(repo)
                    return (
                        <RepoOverviewCompact
                            key={getRepoKey(sidePanelRepo)}
                            {...sidePanelRepo}
                            variant="stripped"
                            fitContent
                            hideDescription={isSelected}
                            selected={isSelected}
                        />
                    )
                })}
            </Carousel>
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, maxHeight: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* a plain (non-flex) wrapper, not a direct flex item of the column above - RepoOverview
                    sets its own internal `flex` shorthand for its OTHER usage (a row inside
                    RepoOverviewTablePagination), which would otherwise make it stretch to fill this
                    column's remaining height; wrapping it neutralizes that so it (and the ButtonGroup
                    sitting flush beneath it, in the same wrapper so the column's own `gap` doesn't
                    apply between them) size to their natural content height instead. */}
                <Box sx={{ flexShrink: 0 }}>
                    <RepoOverview
                        {...repo}
                        loading={false}
                        tracked={tracked}
                        onTrack={onToggleTrack}
                        onDetailedView={() => {}}
                        disableDetailedView
                        disableTrackButton
                        latestRelease={latestRelease}
                        languageLabelLayout="inline"
                        languageCutoff={20}
                    />
                    <Stack direction="row" spacing={2} sx={{ px: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* size="small" on the group cascades to every button - matches the lib
                            Button's own "small" size used for Track/Untrack beside it, so the two
                            sit at the same height instead of the group's larger MUI default */}
                        <MuiButtonGroup variant="outlined" size="small">
                            {TABS.map((tab) => (
                                <MuiButton
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'contained' : 'outlined'}
                                    onClick={() => setActiveTab(tab.id)}
                                    startIcon={<tab.icon fontSize="small" />}
                                >
                                    {tab.label}
                                </MuiButton>
                            ))}
                        </MuiButtonGroup>
                        <Button
                            label={tracked ? 'Untrack' : 'Track'}
                            onClick={onToggleTrack}
                            variant={tracked ? 'outlined' : 'contained'}
                            color={tracked ? 'secondary' : 'primary'}
                            size="small"
                            startIcon={<BookmarkTwoToneIcon />}
                        />
                    </Stack>
                </Box>
                {activeTab === 'readme' ? (
                    <ReadmeSection owner={repo.owner} name={repo.title} />
                ) : (
                    <TabPlaceholder label={activeTabLabel} />
                )}
            </Box>
        </Stack>
    )
}
