import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pill } from './Pill'
import StarTwoToneIcon from '@mui/icons-material/StarTwoTone'
import ChevronRightTwoToneIcon from '@mui/icons-material/ChevronRightTwoTone'

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    iconSize: { control: 'select', options: ['small', 'medium', 'large'] },
    shape: { control: 'select', options: ['pill', 'rounded'] },
    color: { control: 'color' },
  },
}
export default meta

type Story = StoryObj<typeof Pill>

export const Default: Story = {
  args: {
    label: 'Default',
  },
}

export const Warning: Story = {
  args: {
    label: 'Warning',
    variant: 'warning',
  },
}

export const Error: Story = {
  args: {
    label: 'Error',
    variant: 'error',
  },
}

export const Info: Story = {
  args: {
    label: 'Info',
    variant: 'info',
  },
}

export const CustomIcon: Story = {
  args: {
    label: 'Starred',
    variant: 'default',
    startIcon: <StarTwoToneIcon fontSize="inherit" />,
  },
}

export const CustomColor: Story = {
  args: {
    label: 'Archived',
    color: '#6b6375',
  },
}

export const WithEndIcon: Story = {
  args: {
    label: 'Details',
    variant: 'info',
    endIcon: <ChevronRightTwoToneIcon fontSize="inherit" />,
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Pill {...args} size="small" label="Small" />
      <Pill {...args} size="medium" label="Medium" />
      <Pill {...args} size="large" label="Large" />
    </div>
  ),
  args: {
    variant: 'info',
  },
}

export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Pill {...args} shape="pill" label="Pill" />
      <Pill {...args} shape="rounded" label="Rounded" />
    </div>
  ),
  args: {
    variant: 'info',
    startIcon: <StarTwoToneIcon fontSize="inherit" />,
  },
}

// iconSize is independent of `size` - here the label stays small while the icon scales up.
export const IndependentIconSize: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Pill {...args} iconSize="small" label="Small icon" />
      <Pill {...args} iconSize="medium" label="Medium icon" />
      <Pill {...args} iconSize="large" label="Large icon" />
    </div>
  ),
  args: {
    variant: 'info',
    size: 'small',
    startIcon: <StarTwoToneIcon fontSize="inherit" />,
  },
}
