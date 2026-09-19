import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pill } from './Pill'
import StarSharpIcon from '@mui/icons-material/StarSharp'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const meta: Meta<typeof Pill> = {
  title: 'Components/Pill',
  component: Pill,
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    iconSize: { control: 'select', options: ['small', 'medium', 'large'] },
    shape: { control: 'select', options: ['pill', 'rounded'] },
    appearance: { control: 'select', options: ['solid', 'tonal'] },
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
    startIcon: <StarSharpIcon fontSize="inherit" />,
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
    endIcon: <ChevronRightIcon fontSize="inherit" />,
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

// 'tonal' is the automatic default appearance in dark themes - toggle the Storybook
// toolbar's theme switcher, or force it here via the appearance control, to compare.
export const Tonal: Story = {
  args: {
    label: 'Tonal',
    variant: 'warning',
    appearance: 'tonal',
  },
}

export const Solid: Story = {
  args: {
    label: 'Solid',
    variant: 'warning',
    appearance: 'solid',
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
    startIcon: <StarSharpIcon fontSize="inherit" />,
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
    startIcon: <StarSharpIcon fontSize="inherit" />,
  },
}
