import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { fn } from 'storybook/test'
import BuildCircleTwoToneIcon from '@mui/icons-material/BuildCircleTwoTone';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
      variant: { control: 'select', options: ['text', 'outlined', 'contained'] },
      size: { control: 'select', options: ['small', 'large']},
      startIcon: { control: 'boolean'}
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { 
    label: 'Click me', 
    variant: 'contained', 
    color: 'primary',
    size: 'small',
    // use storybook actions fn() to for a click event to appear in actions tab
      onClick: fn(),
  },
}

export const PrimaryIcon: Story = {
    args: {
        label: 'Click me',
        variant: 'contained',
        color: 'primary',
        size: 'small',
        onClick: fn(),
        startIcon: <BuildCircleTwoToneIcon />
    },
}

export const Secondary: Story = {
  args: {
    label: 'Click me',
    variant: 'contained',
    color: 'secondary',
    size: 'small',
    onClick: fn()
  },
}
