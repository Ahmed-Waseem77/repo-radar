import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box } from '@mui/material'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  argTypes: {
    iconWidth: { control: 'number' },
    variant: { control: 'select', options: ['body1', 'body2', 'caption'] },
  },
}
export default meta

type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    message: 'No repositories found for "nonexistent-repo-xyz".',
  },
}

export const LongMessage: Story = {
  args: {
    message: 'This repository doesn’t have a README.',
  },
}

// e.g. a fixed-width side panel column, where the full-size icon/body1 pairing would overflow
export const Compact: Story = {
  args: {
    message: 'Track a repo to see it here.',
    iconWidth: 120,
    variant: 'body2',
  },
  render: (args) => (
    <Box sx={{ width: 300, border: '1px dashed', borderColor: 'divider', py: 4 }}>
      <EmptyState {...args} />
    </Box>
  ),
}
