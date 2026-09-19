import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RepoOverview from './RepoOverview'

const meta: Meta<typeof RepoOverview> = {
  title: 'Components/RepoOverview',
  component: RepoOverview,
  argTypes: {
    tracked: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof RepoOverview>

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

export const Loading: Story = {
    args: {
        ...Default.args,
        loading: true
    }
}
