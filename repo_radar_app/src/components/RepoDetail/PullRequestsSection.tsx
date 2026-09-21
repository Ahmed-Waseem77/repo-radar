import { useState } from 'react'
import { Box, Divider, Skeleton, Stack, TablePagination, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { EmptyState, Pill, TextLink } from '@radar-repo/radar-repo-lib'
import CallMergeTwoToneIcon from '@mui/icons-material/CallMergeTwoTone'
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone'
import ChatBubbleOutlineTwoToneIcon from '@mui/icons-material/ChatBubbleOutlineTwoTone'
import RadioButtonUncheckedTwoToneIcon from '@mui/icons-material/RadioButtonUncheckedTwoTone'
import { usePullRequests } from '../../hooks/api'
import type { PullRequestDto } from '../../api/github/getPullRequests'
import { ISSUES_PER_PAGE_OPTIONS } from './constants'

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
export function PullRequestsSection({ owner, name }: { owner: string; name: string }) {
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
        <Box sx={{ flex: 1, minHeight: 0, px: 0, py: 1 }}>
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
                        <EmptyState message={`Something went wrong loading pull requests: ${error.message}`} sx={{ py: 4 }} />
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
                        <EmptyState message={`No ${state} pull requests found.`} sx={{ py: 4 }} />
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
