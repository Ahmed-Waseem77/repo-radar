import type { Meta, StoryObj } from '@storybook/react-vite'
import InlineCode from './InlineCode'

const meta: Meta<typeof InlineCode> = {
  title: 'Components/InlineCode',
  component: InlineCode,
  argTypes: {
    color: { control: 'select', options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'] },
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

export const InSentence: Story = {
  render: () => (
    <p>
      Run <InlineCode>npm run build</InlineCode> before deploying, then check{' '}
      <InlineCode color="warning">dist/</InlineCode> for the output.
    </p>
  ),
}
