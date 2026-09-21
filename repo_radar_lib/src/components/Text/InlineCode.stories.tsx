import type { Meta, StoryObj } from '@storybook/react-vite'
import NewReleasesTwoToneIcon from '@mui/icons-material/NewReleasesTwoTone'
import InlineCode from './InlineCode'

const meta: Meta<typeof InlineCode> = {
  title: 'Components/InlineCode',
  component: InlineCode,
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
    loading: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof InlineCode>

export const Default: Story = {
  args: {
    children: 'npm install',
  },
}

export const Secondary: Story = {
  args: {
    children: 'git commit',
    color: 'secondary',
  },
}

export const Error: Story = {
  args: {
    children: 'process.exit(1)',
    color: 'error',
  },
}

export const Warning: Story = {
  args: {
    children: 'deprecated()',
    color: 'warning',
  },
}

export const Info: Story = {
  args: {
    children: 'console.log',
    color: 'info',
  },
}

export const Success: Story = {
  args: {
    children: 'npm test',
    color: 'success',
  },
}

// e.g. RepoOverview's release version badge - startIcon leads the text, sized via fontSize:
// 'inherit' so it scales with InlineCode's own font-size rather than needing a fixed px value
export const WithStartIcon: Story = {
  args: {
    children: 'v2.4.0',
    color: 'secondary',
    startIcon: <NewReleasesTwoToneIcon fontSize="inherit" />,
  },
}

// content that hasn't resolved yet (e.g. a version number still being fetched) - swaps the whole
// pill for a small circular badge containing just the animated HourglassIcon; `children`/
// `startIcon` are ignored while loading, so there's nothing else to pass here
export const Loading: Story = {
  args: {
    color: 'secondary',
    loading: true,
  },
}

export const InSentence: Story = {
  render: () => (
    <p>
      Run <InlineCode>npm run build</InlineCode> before deploying, then check{' '}
      <InlineCode color="warning">dist/</InlineCode> for the output.
    </p>
  ),
}
