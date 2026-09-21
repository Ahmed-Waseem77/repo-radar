import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Box, Button as MuiButton, ButtonGroup as MuiButtonGroup, Typography, Stack } from '@mui/material'
import { Button, Carousel, getRepoKey, NoSearchIcon, RepoOverview, RepoOverviewCompact } from '@radar-repo/radar-repo-lib'
import type { RepoOverviewCompactProps } from '@radar-repo/radar-repo-lib'
import BookmarkTwoToneIcon from '@mui/icons-material/BookmarkTwoTone'
import ArticleTwoToneIcon from '@mui/icons-material/ArticleTwoTone'
import BugReportTwoToneIcon from '@mui/icons-material/BugReportTwoTone'
import CallMergeTwoToneIcon from '@mui/icons-material/CallMergeTwoTone'
import TimelineTwoToneIcon from '@mui/icons-material/TimelineTwoTone'
import { useLatestRelease } from '../hooks/api'
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
                <TabPlaceholder label={activeTabLabel} />
            </Box>
        </Stack>
    )
}
