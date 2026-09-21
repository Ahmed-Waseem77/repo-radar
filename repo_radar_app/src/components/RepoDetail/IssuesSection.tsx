import { useState } from 'react'
import {
    Box,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    TablePagination,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import { EmptyState, Pill, TextLink } from '@radar-repo/radar-repo-lib'
import ChatBubbleOutlineTwoToneIcon from '@mui/icons-material/ChatBubbleOutlineTwoTone'
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone'
import RadioButtonUncheckedTwoToneIcon from '@mui/icons-material/RadioButtonUncheckedTwoTone'
import { useIssues, useLabels } from '../../hooks/api'
import { useNarrowScreen } from '../../hooks/useNarrowScreen'
import type { IssueDto } from '../../api/github/getIssues'
import { ISSUES_PER_PAGE_OPTIONS } from './constants'

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

// only mounted while the Issues tab is active (same "fetch on click" reasoning as
// ReadmeSection). Backed by GET /repos/{owner}/{repo}/issues (see getIssues) rather than
// GET /search/issues, on purpose - PullRequestsSection hits this exact same endpoint
// independently (see getPullRequests for why it's a separate request rather than reusing this
// one's leftovers).
export function IssuesSection({ owner, name }: { owner: string; name: string }) {
    const narrow = useNarrowScreen()
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
        <Box sx={{ flex: 1, minHeight: 0, px: 0, py: 1 }}>
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
                        <FormControl size="small" sx={{ minWidth: narrow ? 150 : 200 }}>
                            <InputLabel id={`${owner}-${name}-issue-label-filter`}>Label</InputLabel>
                            <Select
                                labelId={`${owner}-${name}-issue-label-filter`}
                                label="Label"
                                value={label}
                                onChange={(event) => {
                                    setLabel(event.target.value)
                                    setPage(0)
                                }}
                                // a long label name has more room to fight for on a wide screen's
                                // 200px-min dropdown - only narrow's own tighter 150px needs this
                                // to keep the CLOSED select's own rendered value from wrapping
                                // onto a second line instead of just truncating with an ellipsis.
                                sx={narrow ? { '& .MuiSelect-select': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } } : undefined}
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
                        <EmptyState message={`Something went wrong loading issues: ${error.message}`} sx={{ py: 4 }} />
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
                        <EmptyState message={`No ${state} issues found${label ? ` labeled "${label}"` : ''}.`} sx={{ py: 4 }} />
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
