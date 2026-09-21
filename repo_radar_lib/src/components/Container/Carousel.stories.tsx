import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Box, Typography } from '@mui/material'
import Carousel from './Carousel'
import RepoOverviewCompact from './RepoOverviewCompact'
import type { RepoOverviewCompactProps } from './RepoOverviewCompact'
import { Pill } from '../Text/Pill'
import { getRepoKey } from '../../util'

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  argTypes: {
    autoScroll: { control: 'boolean' },
    divider: { control: 'boolean' },
    width: { control: 'number' },
  },
}
export default meta

type Story = StoryObj<typeof Carousel>

// content-agnostic - the carousel doesn't know or care what its children are, just plain
// colored boxes here to prove that
export const SimpleBoxes: Story = {
  args: {
    children: Array.from({ length: 12 }, (_, i) => (
      <Box
        key={i}
        sx={{
          width: 120,
          height: 80,
          flexShrink: 0,
          borderRadius: 1,
          bgcolor: i % 2 === 0 ? 'primary.main' : 'secondary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6">{i + 1}</Typography>
      </Box>
    )),
  },
}

export const Pills: Story = {
  args: {
    children: ['primary', 'secondary', 'success', 'warning', 'error', 'info'].map((variant) => (
      <Pill key={variant} variant={variant as never} label={variant} size="large" />
    )),
  },
}

const makeRepo = (overrides: Partial<RepoOverviewCompactProps>): RepoOverviewCompactProps => ({
  title: 'repo-radar',
  owner: 'ahmedwaseem',
  url: 'https://github.com/ahmedwaseem/repo-radar',
  ownerUrl: 'https://github.com/ahmedwaseem',
  description: 'A dashboard for tracking repository health and activity.',
  lastCommit: {
    hash: 'a1b2c3d',
    date: '2026-09-17',
    developerName: 'Ahmed Waseem',
    url: 'https://github.com/ahmedwaseem/repo-radar/commit/a1b2c3d',
    authorUrl: 'https://github.com/ahmedwaseem',
  },
  starCount: 1280,
  languageInfo: { languages: ['TypeScript', 'CSS'], distribution: [82, 18] },
  topics: [],
  license: 'MIT',
  onTrack: fn(),
  onDetailedView: fn(),
  archived: false,
  loading: false,
  tracked: false,
  ...overrides,
})

const repoFixtures: RepoOverviewCompactProps[] = [
  makeRepo({ title: 'repo-radar' }),
  makeRepo({ title: 'octo-analytics', starCount: 842, license: null }),
  makeRepo({ title: 'lantern-ui', starCount: 314, tracked: true }),
  makeRepo({ title: 'nimbus-cli', starCount: 97 }),
  makeRepo({ title: 'repo-radar-legacy', archived: true, archivalDate: '2025-01-10' }),
]

// the actual intended usage: a horizontally auto-scrolling row of real cards, e.g. "Trending Repos"
export const RepoCards: Story = {
  args: {
    children: repoFixtures.map((repo) => <RepoOverviewCompact key={getRepoKey(repo)} {...repo} />),
  },
}

// auto-scroll starts almost immediately and moves quickly, just to make the loop-back-to-start
// behavior visible without waiting through the default delay/speed in a Storybook preview
export const FastAutoScroll: Story = {
  args: {
    ...RepoCards.args,
    autoScrollDelay: 200,
    autoScrollStep: 4,
    tickMs: 16,
  },
}

export const ManualOnly: Story = {
  args: {
    ...RepoCards.args,
    autoScroll: false,
  },
}

// a divider between each card in a single scrolling row - orientation matches the scroll axis
// (vertical rules for a horizontal row)
export const WithDivider: Story = {
  args: {
    ...RepoCards.args,
    autoScroll: false,
    divider: true,
  },
}

// a vertically-scrolling grid, manually scrolled only - e.g. the Tracked Repos page
export const VerticalGrid: Story = {
  args: {
    children: [
      ...repoFixtures,
      makeRepo({ title: 'stargazer-graph', starCount: 55 }),
      makeRepo({ title: 'commit-weather', starCount: 12, license: null }),
    ].map((repo) => <RepoOverviewCompact key={getRepoKey(repo)} {...repo} />),
    orientation: 'vertical',
    layout: 'grid',
    autoScroll: false,
    maxHeight: 420,
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 420 }}>
        <Story />
      </Box>
    ),
  ],
}

// a single-column vertical grid (narrow enough that only one card fits per line, e.g. the repo
// detail view's side panel) with dividers between rows - this is the specific 'grid' + 'vertical'
// combination that needed the flexBasis:100% fix in Carousel.tsx (see its own comment)
export const VerticalGridWithDivider: Story = {
  args: {
    ...VerticalGrid.args,
    children: repoFixtures.map((repo) => (
      <RepoOverviewCompact key={getRepoKey(repo)} {...repo} variant="stripped" fitContent width={260} />
    )),
    divider: true,
    maxHeight: 420,
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 420, width: 260 }}>
        <Story />
      </Box>
    ),
  ],
}

// the `width` prop, not the wrapping container, is what keeps a 'grid' carousel from exploding
// to its unwrapped max-content width - a plain CSS `width: fit-content` on a wrapping flex
// container sizes from EVERY item laid out in one line (ignoring wrap), not the actually-wrapped
// rendered width, so it comes out far too wide. This sits the carousel beside another block in a
// row specifically to prove it stays a fixed 260px regardless of how much room the row offers.
export const FixedWidthBesideContent: Story = {
  args: {
    ...VerticalGridWithDivider.args,
    width: 260,
  },
  decorators: [
    (Story) => (
      <Box sx={{ height: 420, display: 'flex', gap: 2 }}>
        <Story />
        <Box sx={{ flex: 1, border: '1px dashed gray', p: 2 }}>
          <Typography variant="body2">The rest of the row - the carousel beside it should stay fixed-width.</Typography>
        </Box>
      </Box>
    ),
  ],
}
