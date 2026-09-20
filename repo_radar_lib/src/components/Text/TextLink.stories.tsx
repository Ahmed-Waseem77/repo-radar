import type { Meta, StoryObj } from '@storybook/react-vite'
import { Typography } from '@mui/material'
import { TextLink } from './TextLink'

const meta: Meta<typeof TextLink> = {
  title: 'Components/TextLink',
  component: TextLink,
  argTypes: {
    underline: { control: 'select', options: ['none', 'hover', 'always'] },
  },
}
export default meta

type Story = StoryObj<typeof TextLink>

export const Default: Story = {
  args: {
    href: 'https://github.com/octocat',
    children: 'octocat',
  },
}

// how it's actually used: inheriting the size/color of surrounding text, only picking up its
// own hover treatment
export const InheritingContext: Story = {
  render: (args) => (
    <Typography variant="h5">
      repo-radar by <TextLink {...args} />
    </Typography>
  ),
  args: {
    href: 'https://github.com/octocat',
    children: 'octocat',
  },
}

export const MutedCaption: Story = {
  args: {
    href: 'https://github.com/octocat',
    children: 'octocat',
    variant: 'caption',
    color: 'textSecondary',
  },
}
