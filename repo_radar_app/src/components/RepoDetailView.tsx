import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Box, Button as MuiButton, ButtonGroup as MuiButtonGroup, Slide, Stack, Tooltip } from '@mui/material'
import { Button, getRepoKey, RepoOverview, RepoOverviewCompact } from '@radar-repo/radar-repo-lib'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone'
import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone'
import CallMergeTwoToneIcon from '@mui/icons-material/CallMergeTwoTone'
import TimelineTwoToneIcon from '@mui/icons-material/TimelineTwoTone'
import { useLatestRelease } from '../hooks/api'
import { useNarrowScreen } from '../hooks/useNarrowScreen'
import type { SidePanelState } from '../hooks/useSidePanelRepos'
import type { RepoDto } from '../api/github/mappers'
import {
    IssuesSection,
    PullRequestsSection,
    ReadmeSection,
    RefreshButton,
    SIDE_PANEL_WIDTH,
    SidePanel,
    StarHistorySection,
    getStarHistoryPeriod,
    getStarsTabLabel,
} from './RepoDetail'
import type { StarHistoryPeriod } from './RepoDetail'

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
    // forces a fresh fetch of `repo` itself (RepoDetailPage's own getRepo call), for a session
    // that's been open long enough for its cached/originally-fetched data to go stale. Wired to
    // an actual button here only on a wide screen - on a narrow one the same control lives in
    // App.tsx's AppBar instead (see RepoDetailPage's onRefreshControlsChange).
    onRefresh: () => void
    refreshing: boolean
    // narrow-screen-only, already fully resolved by RepoDetailPage (narrow && App.tsx's own
    // searchPanelOpen, opened exclusively by the search button beside the bottom search field -
    // && there's actually a query to show results for). On a wide screen the panel is a
    // permanent column regardless, so this only matters in the narrow branch.
    searchPanelVisible: boolean
    // closes the overlay from a backdrop tap without leaving this page or touching the search
    // text itself - App.tsx's own setSearchPanelOpen(false), threaded down through
    // RepoDetailPage, so the search button can reopen it without the user retyping anything. The
    // AppBar's own back button/Escape reach the same outcome through App.tsx's handleBack instead.
    onClosePanel: () => void
}

// shared by both layouts below - whichever section is active, rendered exactly the same way
// regardless of screen width (only how its tab gets SELECTED differs - a labeled ButtonGroup on
// a wide screen, a thin icon-only one docked to the bottom on a narrow one).
function ActiveTabSection({ activeTab, repo, starsPeriod }: { activeTab: DetailTab; repo: RepoDto; starsPeriod: StarHistoryPeriod }) {
    if (activeTab === 'readme') return <ReadmeSection owner={repo.owner} name={repo.title} />
    if (activeTab === 'issues') return <IssuesSection owner={repo.owner} name={repo.title} />
    if (activeTab === 'prs') return <PullRequestsSection owner={repo.owner} name={repo.title} />
    return <StarHistorySection owner={repo.owner} name={repo.title} periodMonths={starsPeriod.months} />
}

// the back-chevron / Escape affordance for closing this view lives in App.tsx's AppBar (start
// slot, before the logo) instead of here - keeps the "how do I close this" answer in one place
// regardless of which page opened it, rather than duplicating a back button per page. On a
// narrow screen the same is true of the search overlay below: dismissing it is exclusively an
// AppBar-back/Escape or backdrop-tap action, never a second close button inside the overlay itself.
export function RepoDetailView({ repo, tracked, onToggleTrack, sidePanelState, onRefresh, refreshing, searchPanelVisible, onClosePanel }: RepoDetailViewProps) {
    const narrow = useNarrowScreen()
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

    const selectedRepoKey = getRepoKey(repo)

    if (narrow) {
        return (
            <Box sx={{ position: 'relative', flex: 1, minHeight: 0, maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0, px: 0, py: 0 }}>
                    <Box sx={{ flexShrink: 0 }}>
                        <RepoOverviewCompact
                            {...repo}
                            loading={false}
                            tracked={tracked}
                            onTrack={onToggleTrack}
                            onDetailedView={() => {}}
                            disableDetailedView
                            width="100%"
                        />
                    </Box>
                    <ActiveTabSection activeTab={activeTab} repo={repo} starsPeriod={starsPeriod} />
                </Box>
                {/* thin, icon-only tab bar docked to the bottom of this view - a plain flex
                    sibling of the scrollable content above (not position:fixed), so it always
                    sits flush against the search bar below it (App.tsx's own bottom AppBar,
                    rendered as the next flex sibling in turn) with no gap between the two: same
                    px:2 horizontal inset as that Toolbar's own default gutters, no bottom margin
                    of its own for that same reason. */}
                <Stack
                    direction="row"
                    sx={{ flexShrink: 0, px: 2, py: 0.75, justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}
                >
                    <MuiButtonGroup variant="outlined" size="small">
                        {TABS.map((tab) => (
                            <Tooltip key={tab.id} title={tab.label}>
                                <MuiButton
                                    variant={activeTab === tab.id ? 'contained' : 'outlined'}
                                    onClick={() => setActiveTab(tab.id)}
                                    aria-label={tab.label}
                                    sx={{ minWidth: 0, px: 1.5 }}
                                >
                                    <tab.icon fontSize="small" />
                                </MuiButton>
                            </Tooltip>
                        ))}
                        <Tooltip title={getStarsTabLabel(starsPeriod)}>
                            {/* a disabled MuiButton wouldn't fire the hover events Tooltip needs
                                to show itself - wrapping in a span (which stays interactive
                                either way) is the standard way around that. */}
                            <span>
                                <MuiButton
                                    variant={activeTab === 'stars' ? 'contained' : 'outlined'}
                                    onClick={() => setActiveTab('stars')}
                                    disabled={starsPeriod.disabled}
                                    aria-label={getStarsTabLabel(starsPeriod)}
                                    sx={{ minWidth: 0, px: 1.5 }}
                                >
                                    <TimelineTwoToneIcon fontSize="small" />
                                </MuiButton>
                            </span>
                        </Tooltip>
                    </MuiButtonGroup>
                </Stack>
                {/* dims the content behind the overlay and, tapped, dismisses it - "tapping
                    elsewhere" from the design. Only mounted while the overlay is open, so it
                    never eats clicks the rest of the time. */}
                {searchPanelVisible && (
                    <Box onClick={onClosePanel} sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0, 0, 0, 0.4)', zIndex: 1 }} />
                )}
                {/* slides in from the left edge over the content above; slides back out the same
                    way when dismissed (backdrop tap, or the AppBar's own back button/Escape via
                    App.tsx's handleBack). */}
                <Slide direction="right" in={searchPanelVisible} mountOnEnter unmountOnExit>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDE_PANEL_WIDTH, zIndex: 2, bgcolor: 'background.default', boxShadow: 6, overflow: 'auto' }}>
                        <SidePanel sidePanelState={sidePanelState} selectedRepoKey={selectedRepoKey} />
                    </Box>
                </Slide>
            </Box>
        )
    }

    return (
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0, maxHeight: '100%', maxWidth: '100%', px: 2, py: 2 }}>
            <SidePanel sidePanelState={sidePanelState} selectedRepoKey={selectedRepoKey} />
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
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
                            <RefreshButton onRefresh={onRefresh} refreshing={refreshing} />
                        </Stack>
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
                <ActiveTabSection activeTab={activeTab} repo={repo} starsPeriod={starsPeriod} />
            </Box>
        </Stack>
    )
}
