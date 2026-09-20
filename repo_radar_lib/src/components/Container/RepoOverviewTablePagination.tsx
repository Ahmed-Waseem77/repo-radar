import type { ChangeEvent, MouseEvent, ReactNode } from 'react'
import { Stack, Divider, Typography, TablePagination } from '@mui/material'
import RepoOverview, { type RepoOverviewProps } from './RepoOverview'
import { getRepoKey } from '../../util'

export interface RepoOverviewTablePaginationProps {
    // the data to render for the current page. By default (no `count` given) this is treated
    // as the FULL data set and sliced client-side by page/rowsPerPage. When `count` is given,
    // `repos` is assumed to already be just the current page's rows (e.g. fetched server-side
    // one page at a time) and is rendered as-is instead.
    repos: RepoOverviewProps[]
    page: number
    rowsPerPage: number
    rowsPerPageOptions?: number[]
    // mirrors MUI TablePagination's own onPageChange/onRowsPerPageChange signatures -
    // this component is controlled, the caller owns page/rowsPerPage state
    onPageChange: (event: MouseEvent<HTMLButtonElement> | null, page: number) => void
    onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    // shown in place of the row list + pagination footer when `repos` is empty
    emptyStateImage?: ReactNode
    emptyStateLabel?: string
    // total row count across ALL pages, not just this one - passing this switches the
    // component into server-paginated mode (see `repos` above)
    count?: number
}

export default function RepoOverviewTablePagination({
    repos,
    page,
    rowsPerPage,
    rowsPerPageOptions = [5, 10, 25],
    onPageChange,
    onRowsPerPageChange,
    emptyStateImage,
    emptyStateLabel,
    count,
}: RepoOverviewTablePaginationProps) {
    const serverPaginated = count !== undefined

    if (repos.length === 0) {
        return (
            <Stack direction="column" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 6 }}>
                {emptyStateImage}
                {emptyStateLabel && <Typography color="textDimmed">{emptyStateLabel}</Typography>}
            </Stack>
        )
    }

    const start = page * rowsPerPage
    const visibleRepos = serverPaginated ? repos : repos.slice(start, start + rowsPerPage)

    return (
        <Stack direction="column">
            <Stack direction="column" divider={<Divider />}>
                {visibleRepos.map((repo) => (
                    <RepoOverview key={getRepoKey(repo)} {...repo} />
                ))}
            </Stack>
            <TablePagination
                component="div"
                count={serverPaginated ? count : repos.length}
                page={page}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        </Stack>
    )
}
