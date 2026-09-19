import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RepoOverviewTablePagination from './RepoOverviewTablePagination'
import type { RepoOverviewProps } from './RepoOverview'
import { NoSearchIcon } from '../Icons'

const makeRepo = (overrides: Partial<RepoOverviewProps>): RepoOverviewProps => ({
    title: 'repo-radar',
    description: 'A dashboard for tracking repository health and activity.',
    lastCommit: {
        hash: 'a1b2c3d',
        date: '2026-09-17',
        developerName: 'Ahmed Waseem',
    },
    starCount: 1280,
    languageInfo: {
        languages: ['TypeScript', 'CSS', 'JavaScript'],
        distribution: [82, 12, 6],
    },
    topics: ['dashboard', 'github', 'analytics'],
    onTrack: fn(),
    onDetailedView: fn(),
    archived: false,
    loading: false,
    tracked: false,
    ...overrides,
})

const repos: RepoOverviewProps[] = [
    makeRepo({ title: 'repo-radar', starCount: 1280 }),
    makeRepo({ title: 'octo-analytics', starCount: 842, languageInfo: { languages: ['Go', 'Python'], distribution: [70, 30] } }),
    makeRepo({ title: 'lantern-ui', starCount: 314, tracked: true, languageInfo: { languages: ['TypeScript', 'CSS'], distribution: [90, 10] } }),
    makeRepo({ title: 'nimbus-cli', starCount: 97, languageInfo: { languages: ['Rust'], distribution: [100] } }),
    makeRepo({ title: 'repo-radar-legacy', archived: true, archivalDate: '2025-01-10', starCount: 55 }),
    makeRepo({ title: 'wayfinder', starCount: 2210, tracked: true, languageInfo: { languages: ['TypeScript', 'JavaScript', 'HTML'], distribution: [60, 30, 10] } }),
    makeRepo({ title: 'quartz-docs', starCount: 18, languageInfo: { languages: ['Markdown'], distribution: [100] } }),
]

const meta: Meta<typeof RepoOverviewTablePagination> = {
    title: 'Components/RepoOverviewTablePagination',
    component: RepoOverviewTablePagination,
}
export default meta

type Story = StoryObj<typeof RepoOverviewTablePagination>

// wraps the controlled component with local state so pagination is actually interactive
// in Storybook, the same way a real consumer would own page/rowsPerPage.
function InteractivePagination(args: Story['args']) {
    const [page, setPage] = useState(args?.page ?? 0)
    const [rowsPerPage, setRowsPerPage] = useState(args?.rowsPerPage ?? 5)

    return (
        <RepoOverviewTablePagination
            {...args}
            repos={args?.repos ?? repos}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(0)
            }}
        />
    )
}

export const Default: Story = {
    render: (args) => <InteractivePagination {...args} />,
    args: {
        repos,
        page: 0,
        rowsPerPage: 5,
    },
}

export const SmallPageSize: Story = {
    render: (args) => <InteractivePagination {...args} />,
    args: {
        repos,
        page: 0,
        rowsPerPage: 2,
        rowsPerPageOptions: [2, 4, 6],
    },
}

export const Empty: Story = {
    render: (args) => <InteractivePagination {...args} />,
    args: {
        repos: [],
        page: 0,
        rowsPerPage: 5,
        emptyStateImage: <NoSearchIcon sx={{ width: 160, height: 'auto' }} />,
        emptyStateLabel: 'No repositories found',
    },
}

// a handful of loading stubs - the row data doesn't matter here since RepoOverview's
// loading branch ignores everything but `loading` itself.
const loadingRepos: RepoOverviewProps[] = [
    makeRepo({ title: 'loading-1', loading: true }),
    makeRepo({ title: 'loading-2', loading: true }),
    makeRepo({ title: 'loading-3', loading: true }),
]

export const Loading: Story = {
    render: (args) => <InteractivePagination {...args} />,
    args: {
        repos: loadingRepos,
        page: 0,
        rowsPerPage: 5,
    },
}
