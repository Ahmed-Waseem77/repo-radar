import type { Meta, StoryObj } from '@storybook/react-vite'
import { NotFoundNotice } from './NotFoundNotice'

const meta: Meta<typeof NotFoundNotice> = {
  title: 'Components/NotFoundNotice',
  component: NotFoundNotice,
}
export default meta

type Story = StoryObj<typeof NotFoundNotice>

export const Default: Story = {
  args: {
    resource: 'commit',
  },
}

export const Languages: Story = {
  args: {
    resource: 'languages',
  },
}
