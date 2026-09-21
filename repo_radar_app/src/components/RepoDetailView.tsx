import { useState } from 'react'
import type { MouseEvent } from 'react'
import {
    Box,
    Button as MuiButton,
    ButtonGroup as MuiButtonGroup,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Table,
    TableCell,
    TablePagination,
    Typography,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material'
import { useColorScheme, useTheme } from '@mui/material/styles'
import { LineChart } from '@mui/x-charts/LineChart'
import { Button, Carousel, getRepoKey, InlineCode, NoSearchIcon, Pill, RepoOverview, RepoOverviewCompact, TextLink } from '@radar-repo/radar-repo-lib'
import { MuiMarkdown, getOverrides } from 'mui-markdown'
import type { Overrides } from 'mui-markdown'
import { Highlight, themes as prismThemes } from 'prism-react-renderer'
import type { PrismTheme } from 'prism-react-renderer'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone'
import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone'
import CallMergeTwoToneIcon from '@mui/icons-material/CallMergeTwoTone'
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone'
import ChatBubbleOutlineTwoToneIcon from '@mui/icons-material/ChatBubbleOutlineTwoTone'
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone'
import RadioButtonUncheckedTwoToneIcon from '@mui/icons-material/RadioButtonUncheckedTwoTone'
import TimelineTwoToneIcon from '@mui/icons-material/TimelineTwoTone'
import { useIssues, useLabels, useLatestRelease, usePullRequests, useReadme, useStarHistory } from '../hooks/api'
import type { SidePanelState } from '../hooks/useSidePanelRepos'
import type { IssueDto } from '../api/github/getIssues'
import type { PullRequestDto } from '../api/github/getPullRequests'
import type { RepoDto } from '../api/github/mappers'

type DetailTab = 'readme' | 'issues' | 'prs' | 'stars'

// 'stars' isn't in this list - its label/disabled state depends on the repo's age (see
// getStarHistoryPeriod), so it's rendered separately, right after this list is mapped.
const TABS: { id: Exclude<DetailTab, 'stars'>; label: string; icon: typeof ArticleTwoToneIcon }[] = [
    { id: 'readme', label: 'README', icon: ArticleTwoToneIcon },
    { id: 'issues', label: 'Issues', icon: BugReportTwoToneIcon },
    { id: 'prs', label: 'Pull Requests', icon: CallMergeTwoToneIcon },
]

export interface RepoDetailViewProps {
    // the currently-selected repo, shown in full in the top RepoOverview
    repo: RepoDto
    tracked: boolean
    onToggleTrack: (event: MouseEvent<HTMLButtonElement>) => void
    // the caller's own live search/tracked-filter result for its side panel (see
    // useSidePanelRepos) - each ready item's onDetailedView is expected to already be wired by
    // the caller to switch selection (not to open/close this view), so clicking a card here just
    // changes `repo` above
    sidePanelState: SidePanelState
}

const SIDE_PANEL_WIDTH = 300
const SIDE_PANEL_LOADING_COUNT = 6

// same NoSearchIcon + dimmed message convention as the tab sections' own EmptyState, just sized
// down to actually fit this 300px-wide column instead of the main content area's full width.
function SidePanelMessage({ message }: { message: string }) {
    return (
        <Box sx={{ width: SIDE_PANEL_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, px: 2, py: 4, textAlign: 'center' }}>
            <NoSearchIcon sx={{ width: 120, height: 'auto' }} />
            <Typography variant="body2" color='textDimmedInverted'>{message}</Typography>
        </Box>
    )
}

// dummy-but-complete RepoOverviewDto fields, same convention Homepage/TrackedRepos already use
// for their own loading placeholder cards - RepoOverviewCompact's `loading` prop only skips
// RENDERING these, it still requires the full shape.
function SidePanelLoading() {
    return (
        <>
            {Array.from({ length: SIDE_PANEL_LOADING_COUNT }, (_, index) => (
                <RepoOverviewCompact
                    key={`side-panel-loading-${index}`}
                    title={`loading-${index}`}
                    owner=""
                    url=""
                    ownerUrl=""
                    description=""
                    lastCommit={{ hash: '', date: '', developerName: '', url: '' }}
                    starCount={0}
                    languageInfo={{ languages: [], distribution: [] }}
                    topics={[]}
                    archived={false}
                    onTrack={() => {}}
                    onDetailedView={() => {}}
                    variant="stripped"
                    fitContent
                    loading
                    tracked={false}
                />
            ))}
        </>
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
                <Typography variant="body1" color='textDimmedInverted'>This repository doesn&apos;t have a README.</Typography>
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

const ISSUES_PER_PAGE_OPTIONS = [10, 25, 50]

// same NoSearchIcon + dimmed message convention as ReadmeSection's own not-found state - covers
// both "something went wrong" and "nothing matches this filter" with one message. Shared by
// IssuesSection and PullRequestsSection - identical need, no per-tab logic in it.
function EmptyState({ message }: { message: string }) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, py: 4 }}>
            <NoSearchIcon sx={{ width: 200, height: 'auto' }} />
            <Typography variant="body1" color='textDimmedInverted'>{message}</Typography>
        </Box>
    )
}

function IssueRow({ issue }: { issue: IssueDto }) {
    const StateIcon = issue.state === 'open' ? RadioButtonUncheckedTwoToneIcon : CheckCircleTwoToneIcon

    return (
        <Stack direction="row" spacing={1.5} sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}>
            <StateIcon fontSize="small" color={issue.state === 'open' ? 'success' : 'secondary'} sx={{ mt: 0.25, flexShrink: 0 }} />
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <TextLink href={issue.url} variant="body2" sx={{ fontWeight: 600 }}>
                        {issue.title}
                    </TextLink>
                    <Typography variant="caption" color='textDimmedInverted'>#{issue.number}</Typography>
                </Stack>
                {issue.labels.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                        {issue.labels.map((label) => (
                            <Pill key={label.name} label={label.name} color={`#${label.color}`} size="small" />
                        ))}
                    </Stack>
                )}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color='textDimmedInverted'>
                        opened {issue.createdAt}
                        {issue.authorLogin && (
                            <>
                                {' by '}
                                <TextLink href={issue.authorUrl ?? issue.url}>{issue.authorLogin}</TextLink>
                            </>
                        )}
                    </Typography>
                    {issue.commentCount > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <ChatBubbleOutlineTwoToneIcon color="disabled" sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color='textDimmedInverted'>{issue.commentCount}</Typography>
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Stack>
    )
}

// only mounted while the Issues tab is active (same "fetch on click" reasoning as ReadmeSection).
// Backed by GET /repos/{owner}/{repo}/issues (see getIssues) rather than GET /search/issues, on
// purpose - PullRequestsSection hits this exact same endpoint independently (see getPullRequests
// for why it's a separate request rather than reusing this one's leftovers).
function IssuesSection({ owner, name }: { owner: string; name: string }) {
    const [state, setState] = useState<'open' | 'closed'>('open')
    const [label, setLabel] = useState('')
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(ISSUES_PER_PAGE_OPTIONS[0])

    const { data: labels } = useLabels({ owner, name })
    const { data, loading, error } = useIssues({
        owner,
        name,
        state,
        label: label || undefined,
        page: page + 1,
        perPage: rowsPerPage,
    })

    return (
        // same px/py:2 outer inset as ReadmeSection's own wrapper - lines this card's edges up
        // with the button-group/track-button row's `px: 2` above it. The toolbar, its Divider,
        // the row dividers and the pagination footer all now live INSIDE this bordered card
        // instead of directly in the flex column - a plain <Divider/> has no margin of its own,
        // so it used to render edge-to-edge across the whole column instead of stopping at this
        // inset, which is what threw it out of line with that row.
        <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={state}
                        onChange={(_event, value: 'open' | 'closed' | null) => {
                            // an exclusive ToggleButtonGroup fires with `null` when the already-active
                            // button is clicked again - ignore that rather than clearing the filter.
                            if (value === null) return
                            setState(value)
                            setPage(0)
                        }}
                    >
                        <ToggleButton value="open">
                            <RadioButtonUncheckedTwoToneIcon fontSize="small" sx={{ mr: 0.75 }} />
                            Open
                        </ToggleButton>
                        <ToggleButton value="closed">
                            <CheckCircleTwoToneIcon fontSize="small" sx={{ mr: 0.75 }} />
                            Closed
                        </ToggleButton>
                    </ToggleButtonGroup>
                    {/* only shown once labels have actually loaded and the repo has at least one -
                        an empty dropdown would just be a filter for something that can't ever match. */}
                    {labels && labels.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id={`${owner}-${name}-issue-label-filter`}>Label</InputLabel>
                            <Select
                                labelId={`${owner}-${name}-issue-label-filter`}
                                label="Label"
                                value={label}
                                onChange={(event) => {
                                    setLabel(event.target.value)
                                    setPage(0)
                                }}
                            >
                                <MenuItem value="">All labels</MenuItem>
                                {labels.map((issueLabel) => (
                                    <MenuItem key={issueLabel.name} value={issueLabel.name}>
                                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `#${issueLabel.color}`, flexShrink: 0 }} />
                                            <span>{issueLabel.name}</span>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Stack>
                <Divider />
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {error ? (
                        <EmptyState message={`Something went wrong loading issues: ${error.message}`} />
                    ) : loading || !data ? (
                        <Stack divider={<Divider />}>
                            {Array.from({ length: rowsPerPage }, (_, index) => (
                                <Stack key={index} direction="row" spacing={1.5} sx={{ px: 2, py: 1.5, alignItems: 'center' }}>
                                    <Skeleton variant="circular" width={20} height={20} />
                                    <Skeleton variant="text" sx={{ flex: 1 }} />
                                </Stack>
                            ))}
                        </Stack>
                    ) : data.items.length === 0 ? (
                        <EmptyState message={`No ${state} issues found${label ? ` labeled "${label}"` : ''}.`} />
                    ) : (
                        <Stack divider={<Divider />}>
                            {data.items.map((issue) => (
                                <IssueRow key={issue.id} issue={issue} />
                            ))}
                        </Stack>
                    )}
                </Box>
                <TablePagination
                    component="div"
                    count={data?.totalCount ?? 0}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={ISSUES_PER_PAGE_OPTIONS}
                    onPageChange={(_event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(Number(event.target.value))
                        setPage(0)
                    }}
                    // flat 16px on both sides (rather than the toolbar's own default gutters,
                    // which are also asymmetric between sides - see below) - this card's own
                    // border already establishes the outer margin, so this just needs to match
                    // the same px:2 content inset the toolbar/rows above use.
                    sx={{ '& .MuiTablePagination-toolbar': { pl: 2, pr: 2 } }}
                />
            </Box>
        </Box>
    )
}

// GitHub only tracks open/closed on a PR, same as any issue - "merged" isn't a state, it's
// state === 'closed' with merged_at set (see getPullRequests' mapPullRequest), so the per-row
// status shown here is a 3-way split even though the section's own Open/Closed toggle below is
// still 2-way, same as GitHub's own PR list UI.
function PullRequestStatusIcon({ status }: { status: PullRequestDto['status'] }) {
    if (status === 'merged') return <CallMergeTwoToneIcon fontSize="small" color="info" sx={{ mt: 0.25, flexShrink: 0 }} />
    if (status === 'closed') return <CancelTwoToneIcon fontSize="small" color="error" sx={{ mt: 0.25, flexShrink: 0 }} />
    return <RadioButtonUncheckedTwoToneIcon fontSize="small" color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
}

// mirrors IssueRow - same fields (title/number/labels/author/comments), just a 3-way status icon
// instead of IssueRow's 2-way one, and no separate label filter above it (not asked for on this tab).
function PullRequestRow({ pullRequest }: { pullRequest: PullRequestDto }) {
    return (
        <Stack direction="row" spacing={1.5} sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}>
            <PullRequestStatusIcon status={pullRequest.status} />
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <TextLink href={pullRequest.url} variant="body2" sx={{ fontWeight: 600 }}>
                        {pullRequest.title}
                    </TextLink>
                    <Typography variant="caption" color='textDimmedInverted'>#{pullRequest.number}</Typography>
                </Stack>
                {pullRequest.labels.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                        {pullRequest.labels.map((label) => (
                            <Pill key={label.name} label={label.name} color={`#${label.color}`} size="small" />
                        ))}
                    </Stack>
                )}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color='textDimmedInverted'>
                        opened {pullRequest.createdAt}
                        {pullRequest.authorLogin && (
                            <>
                                {' by '}
                                <TextLink href={pullRequest.authorUrl ?? pullRequest.url}>{pullRequest.authorLogin}</TextLink>
                            </>
                        )}
                    </Typography>
                    {pullRequest.commentCount > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <ChatBubbleOutlineTwoToneIcon color="disabled" sx={{ fontSize: 14 }} />
                            <Typography variant="caption" color='textDimmedInverted'>{pullRequest.commentCount}</Typography>
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Stack>
    )
}

// only mounted while the Pull Requests tab is active (same "fetch on click" reasoning as
// ReadmeSection/IssuesSection). Structurally a copy of IssuesSection (same card/toolbar/
// pagination shell) - kept as a separate component rather than a shared one since the two
// diverge in real ways (label filter, 2-way vs 3-way row status) that would otherwise need to be
// parameterized right back into near-equivalent complexity.
function PullRequestsSection({ owner, name }: { owner: string; name: string }) {
    const [state, setState] = useState<'open' | 'closed'>('open')
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(ISSUES_PER_PAGE_OPTIONS[0])

    const { data, loading, error } = usePullRequests({
        owner,
        name,
        state,
        page: page + 1,
        perPage: rowsPerPage,
    })

    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, alignItems: 'center' }}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={state}
                        onChange={(_event, value: 'open' | 'closed' | null) => {
                            // an exclusive ToggleButtonGroup fires with `null` when the already-active
                            // button is clicked again - ignore that rather than clearing the filter.
                            if (value === null) return
                            setState(value)
                            setPage(0)
                        }}
                    >
                        <ToggleButton value="open">
                            <RadioButtonUncheckedTwoToneIcon fontSize="small" sx={{ mr: 0.75 }} />
                            Open
                        </ToggleButton>
                        {/* a neutral "cancel" glyph rather than IssueSection's checkmark - this
                            bucket mixes merged AND closed-unmerged PRs, so a checkmark (implying
                            a single successful resolution) would be misleading here specifically;
                            each row's own PullRequestStatusIcon is what actually distinguishes them. */}
                        <ToggleButton value="closed">
                            <CancelTwoToneIcon fontSize="small" sx={{ mr: 0.75 }} />
                            Closed
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <Divider />
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {error ? (
                        <EmptyState message={`Something went wrong loading pull requests: ${error.message}`} />
                    ) : loading || !data ? (
                        <Stack divider={<Divider />}>
                            {Array.from({ length: rowsPerPage }, (_, index) => (
                                <Stack key={index} direction="row" spacing={1.5} sx={{ px: 2, py: 1.5, alignItems: 'center' }}>
                                    <Skeleton variant="circular" width={20} height={20} />
                                    <Skeleton variant="text" sx={{ flex: 1 }} />
                                </Stack>
                            ))}
                        </Stack>
                    ) : data.items.length === 0 ? (
                        <EmptyState message={`No ${state} pull requests found.`} />
                    ) : (
                        <Stack divider={<Divider />}>
                            {data.items.map((pullRequest) => (
                                <PullRequestRow key={pullRequest.id} pullRequest={pullRequest} />
                            ))}
                        </Stack>
                    )}
                </Box>
                <TablePagination
                    component="div"
                    count={data?.totalCount ?? 0}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={ISSUES_PER_PAGE_OPTIONS}
                    onPageChange={(_event, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(event) => {
                        setRowsPerPage(Number(event.target.value))
                        setPage(0)
                    }}
                    sx={{ '& .MuiTablePagination-toolbar': { pl: 2, pr: 2 } }}
                />
            </Box>
        </Box>
    )
}

const STAR_HISTORY_CHART_HEIGHT = 440

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

interface StarHistoryPeriod {
    disabled: boolean
    months: number
}

// createdAt is optional on RepoDto (see RepoOverviewDto) - missing it (a loading placeholder,
// somewhere that never populated it) is treated as "assume old enough", not as young, since
// disabling the tab or mislabeling its period on missing data would be a worse default.
function getStarHistoryPeriod(createdAt: string | undefined): StarHistoryPeriod {
    if (!createdAt) return { disabled: false, months: STAR_HISTORY_DEFAULT_PERIOD_MONTHS }

    const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const ageInMonths = Math.floor(ageInDays / DAYS_PER_MONTH)

    if (ageInMonths < STAR_HISTORY_MIN_AGE_MONTHS) return { disabled: true, months: ageInMonths }
    if (ageInMonths < STAR_HISTORY_ADAPTIVE_CEILING_MONTHS) return { disabled: false, months: ageInMonths }
    return { disabled: false, months: STAR_HISTORY_DEFAULT_PERIOD_MONTHS }
}

function getStarsTabLabel(period: StarHistoryPeriod): string {
    return period.disabled ? 'Repo too Young for Star History' : `Stars (${period.months}mo)`
}

// only mounted while the Star History tab is active (same "fetch on click" reasoning as the other
// tabs, and only reachable at all once getStarHistoryPeriod says this repo isn't too young).
// Backed by GET /repos/{owner}/{repo}/stargazers/history (see getStarHistory) - shows a weekly
// RATE (stars gained that week), not a cumulative running total - see that file for why.
// `periodMonths` only affects the title text here, not the fetch itself - getStarHistory always
// requests up to its own max window and GitHub naturally returns less for a younger repo, so the
// chart already shows the right data regardless; this is purely about not mislabeling it.
function StarHistorySection({ owner, name, periodMonths }: { owner: string; name: string; periodMonths: number }) {
    const theme = useTheme()
    const { data, loading, error } = useStarHistory({ owner, name })

    if (error) {
        return <EmptyState message={`Something went wrong loading star history: ${error.message}`} />
    }

    if (loading || !data) {
        return (
            <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}>
                <Skeleton variant="text" width="45%" sx={{ fontSize: '1.25rem', mb: 1 }} />
                <Skeleton variant="rounded" sx={{ width: '100%', height: STAR_HISTORY_CHART_HEIGHT }} />
            </Box>
        )
    }

    if (data.length === 0) {
        return <EmptyState message="This repository has no stars yet." />
    }

    return (
        <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2, overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Stars gained per week - last {periodMonths} month{periodMonths === 1 ? '' : 's'}
            </Typography>
            <LineChart
                height={STAR_HISTORY_CHART_HEIGHT}
                series={[
                    {
                        data: data.map((point) => point.starsGained),
                        label: 'Stars per week',
                        color: theme.vars?.palette.secondary.main ?? theme.palette.secondary.main,
                        area: true,
                        showMark: true,
                        curve: 'monotoneX',
                    },
                ]}
                xAxis={[
                    {
                        data: data.map((point) => new Date(point.date)),
                        scaleType: 'time',
                        label: 'Week of',
                        valueFormatter: (date: Date) => date.toLocaleDateString(),
                    },
                ]}
                yAxis={[{ label: 'Stars / week', min: 0 }]}
                grid={{ horizontal: true }}
                // tonal, matching the rest of the app: a solid line/marks in the series color (set
                // above), but the area fill - normally rendered at full, solid opacity - is faded
                // down to a translucent tint of that same color instead of a flat fill.
                sx={{ '& .MuiLineChart-area': { fillOpacity: 0.18 } }}
                hideLegend
            />
        </Box>
    )
}

// the back-chevron / Escape affordance for closing this view lives in App.tsx's AppBar (start
// slot, before the logo) instead of here - keeps the "how do I close this" answer in one place
// regardless of which page opened it, rather than duplicating a back button per page.
export function RepoDetailView({ repo, tracked, onToggleTrack, sidePanelState }: RepoDetailViewProps) {
    const { data: latestRelease } = useLatestRelease({ owner: repo.owner, name: repo.title })
    const [activeTab, setActiveTab] = useState<DetailTab>('readme')
    const starsPeriod = getStarHistoryPeriod(repo.createdAt)

    // the Stars tab can go from enabled to disabled out from under an already-open detail view -
    // switching the side panel to a too-young repo while it was the active tab, since
    // RepoDetailView isn't remounted per repo (see sidePanelState's own selection handling) - React's
    // documented "adjust state during render" pattern for exactly this: a prop change invalidating
    // existing state. Falls back to the always-available README tab rather than leaving `stars`
    // selected with nothing valid to show for it.
    if (activeTab === 'stars' && starsPeriod.disabled) {
        setActiveTab('readme')
    }

    return (
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0, maxHeight: '100%', maxWidth: '100%', px: 2, py: 2 }}>
            {/* `width` (a real Carousel prop, not just wrapping it in a sized Box) is required here,
                not optional: this is a 'grid' layout, and a plain CSS `width: fit-content` on a
                wrapping flex container sizes from its UNWRAPPED max-content width (every card side
                by side in one line), not the actually-wrapped rendered width - so it blows out far
                wider than one card. `flexShrink: 0` (set internally whenever `width` is passed) is
                what actually keeps this fixed regardless of how little/much room the row beside it wants.
                error/empty/notFound render a plain sized Box INSTEAD of the Carousel, rather than
                feeding it a non-card child - Carousel's 'grid' layout assumes card-shaped children,
                so a single big message box doesn't measure/lay out the same way a card would. */}
            {sidePanelState.status === 'error' ? (
                <SidePanelMessage message={`Something went wrong loading repos: ${sidePanelState.error.message}`} />
            ) : sidePanelState.status === 'empty' || sidePanelState.status === 'notFound' ? (
                <SidePanelMessage message={sidePanelState.message} />
            ) : (
                <Carousel width={SIDE_PANEL_WIDTH} orientation="vertical" layout="grid" autoScroll={false} gutter={2} divider>
                    {sidePanelState.status === 'loading' ? (
                        <SidePanelLoading />
                    ) : (
                        sidePanelState.repos.map((sidePanelRepo) => {
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
                        })
                    )}
                </Carousel>
            )}
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
                            <MuiButton
                                variant={activeTab === 'stars' ? 'contained' : 'outlined'}
                                onClick={() => setActiveTab('stars')}
                                startIcon={<TimelineTwoToneIcon fontSize="small" />}
                                disabled={starsPeriod.disabled}
                                sx={{ maxWidth: 220 }}
                            >
                                {/* the "too young" message is long enough to wrap or blow out the
                                    button group's own width - this is what keeps it to one line,
                                    truncated with an ellipsis, instead */}
                                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {getStarsTabLabel(starsPeriod)}
                                </Box>
                            </MuiButton>
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
                {activeTab === 'readme' && <ReadmeSection owner={repo.owner} name={repo.title} />}
                {activeTab === 'issues' && <IssuesSection owner={repo.owner} name={repo.title} />}
                {activeTab === 'prs' && <PullRequestsSection owner={repo.owner} name={repo.title} />}
                {activeTab === 'stars' && <StarHistorySection owner={repo.owner} name={repo.title} periodMonths={starsPeriod.months} />}
            </Box>
        </Stack>
    )
}
