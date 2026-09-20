import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Stack } from '@mui/material'
import RepoOverviewCompact from './RepoOverviewCompact'
import type { RepoOverviewCompactProps } from './RepoOverviewCompact'

const meta: Meta<typeof RepoOverviewCompact> = {
  title: 'Components/RepoOverviewCompact',
  component: RepoOverviewCompact,
  argTypes: {
    tracked: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof RepoOverviewCompact>

export const Default: Story = {
  args: {
    title: 'repo-radar',
    description: 'A dashboard for tracking repository health and activity.',
    lastCommit: {
      hash: 'a1b2c3d',
      description: 'Wires useColorScheme into the app shell.',
      date: '2026-09-17',
      developerName: 'Ahmed Waseem',
    },
    starCount: 1280,
    languageInfo: {
      languages: ['TypeScript', 'CSS', 'JavaScript'],
      distribution: [82, 12, 6],
    },
    topics: ['dashboard', 'github', 'analytics'],
    license: 'MIT',
    onTrack: fn(),
    onDetailedView: fn(),
    archived: false,
    loading: false,
    tracked: false,
  },
}

export const Tracked: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-tracked',
    tracked: true,
  },
}

export const Archived: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-legacy',
    archived: true,
    archivalDate: '2025-01-10',
  },
}

export const Unlicensed: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-scratch',
    license: null,
  },
}

export const LongDescription: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-verbose',
    description:
      'A dashboard for tracking repository health, activity, contributor velocity, language distribution, and everything else a maintainer might want at a glance - clamped to two lines here.',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

// how it's actually used: a horizontally-scrolling row of cards, e.g. a "Trending Repos" section
const rowRepos: RepoOverviewCompactProps[] = [
  { ...(Default.args as RepoOverviewCompactProps), title: 'repo-radar' },
  { ...(Default.args as RepoOverviewCompactProps), title: 'octo-analytics', starCount: 842, license: null },
  { ...(Default.args as RepoOverviewCompactProps), title: 'lantern-ui', starCount: 314, tracked: true },
  { ...(Default.args as RepoOverviewCompactProps), title: 'nimbus-cli', starCount: 97 },
  { ...(Default.args as RepoOverviewCompactProps), title: 'repo-radar-legacy', archived: true, archivalDate: '2025-01-10' },
]

export const ScrollingRow: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', maxWidth: 600, pb: 1 }}>
      {rowRepos.map((repo) => (
        <RepoOverviewCompact key={repo.title} {...repo} />
      ))}
    </Stack>
  ),
}
