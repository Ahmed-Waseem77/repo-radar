import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import RepoOverview from './RepoOverview'

const meta: Meta<typeof RepoOverview> = {
  title: 'Components/RepoOverview',
  component: RepoOverview,
  argTypes: {
    tracked: { control: 'boolean' },
    disableDetailedView: { control: 'boolean' },
    disableTrackButton: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof RepoOverview>

export const Default: Story = {
  args: {
    title: 'repo-radar',
    owner: 'ahmedwaseem',
    url: 'https://github.com/ahmedwaseem/repo-radar',
    ownerUrl: 'https://github.com/ahmedwaseem',
    description: 'A dashboard for tracking repository health and activity.',
    lastCommit: {
      hash: 'a1b2c3d',
      description: 'Wires useColorScheme into the app shell.',
      date: '2026-09-17',
      developerName: 'Ahmed Waseem',
      url: 'https://github.com/ahmedwaseem/repo-radar/commit/a1b2c3d',
      authorUrl: 'https://github.com/ahmedwaseem',
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
    // explicit rather than left unset - `undefined` specifically means "fetch in flight" and
    // would show a perpetual loading badge; this story isn't demonstrating that state.
    latestRelease: null,
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

// confirms the pill row wraps onto its own line(s) instead of overflowing/squeezing
// once the component is too narrow to fit every pill on one row
export const NarrowContainer: Story = {
  render: (args) => (
    <div style={{ width: 320, border: '1px dashed gray' }}>
      <RepoOverview {...args} />
    </div>
  ),
  args: {
    ...Default.args,
    title: 'repo-radar-narrow',
    archived: true,
    archivalDate: '2025-01-10',
    starCount: 128000,
    license: 'Apache-2.0',
  },
}

export const Loading: Story = {
    args: {
        ...Default.args,
        loading: true
    }
}

// commit authors aren't always linked to a GitHub account - developerName renders as plain
// text (no link) when lastCommit.authorUrl is absent
export const UnlinkedCommitAuthor: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-external',
    lastCommit: {
      ...Default.args!.lastCommit!,
      developerName: 'external-contributor',
      authorUrl: undefined,
    },
  },
}

// e.g. GitHub 409s the commits endpoint for an empty/no-history repo - the rest of the card
// (title, pills, description) still comes from the search/list response and renders normally,
// only the Latest Commit section degrades to an error notice
export const CommitNotFound: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-empty',
    lastCommit: null,
  },
}

export const WithLatestRelease: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-released',
    latestRelease: {
      version: 'v2.4.0',
      url: 'https://github.com/ahmedwaseem/repo-radar/releases/tag/v2.4.0',
    },
  },
}

// the release fetch hasn't settled yet - shows InlineCode's own animated circular loading badge
// instead of nothing, so the header doesn't jump once it resolves
export const LoadingLatestRelease: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-loading',
    latestRelease: undefined,
  },
}

// used as the top card of the (non-routable) repo detail view - clicking the card itself
// shouldn't navigate anywhere since you're already viewing its details, but Track/Untrack
// still needs to work
export const DetailView: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-detail',
    disableDetailedView: true,
    latestRelease: {
      version: 'v2.4.0',
      url: 'https://github.com/ahmedwaseem/repo-radar/releases/tag/v2.4.0',
    },
  },
}

// e.g. the repo detail view, which places its own Track/Untrack button inline with other actions
// (a tab switcher) instead of using the card's default spot for it
export const NoTrackButton: Story = {
  args: {
    ...Default.args,
    title: 'repo-radar-external-track',
    disableTrackButton: true,
  },
}
