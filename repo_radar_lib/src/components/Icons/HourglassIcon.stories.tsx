import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stack, Typography } from '@mui/material'
import { HourglassIcon } from './HourglassIcon'

const meta: Meta<typeof HourglassIcon> = {
  title: 'Components/HourglassIcon',
  component: HourglassIcon,
  argTypes: {
    fontSize: { control: 'select', options: ['small', 'medium', 'large', 'inherit'] },
    color: { control: 'select', options: ['inherit', 'primary', 'secondary', 'action', 'disabled', 'error', 'warning', 'info', 'success'] },
  },
}
export default meta

type Story = StoryObj<typeof HourglassIcon>

// a generic animated loading indicator - continually bobs and rotates 360°, cross-fading between
// the "sand on top"/"sand on bottom" TwoTone variants right as the rotation crosses upside-down,
// so it reads as an hourglass actually being turned over rather than a plain spinner
export const Default: Story = {
  args: {
    fontSize: 'large',
  },
}

export const Small: Story = {
  args: {
    fontSize: 'small',
  },
}

export const Colored: Story = {
  args: {
    fontSize: 'large',
    color: 'secondary',
  },
}

// fontSize:'inherit' scales with the surrounding text - this is how InlineCode's own loading
// state uses it (see InlineCode.stories.tsx's Loading story)
export const InheritedSize: Story = {
  render: () => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Typography variant="h4">Fetching</Typography>
      <HourglassIcon fontSize="inherit" sx={{ fontSize: '2.125rem' }} />
    </Stack>
  ),
}
