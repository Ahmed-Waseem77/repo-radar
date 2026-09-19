import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchField } from './SearchField'

const meta: Meta<typeof SearchField> = {
    title: 'Components/SearchField',
    component: SearchField,
}
export default meta

type Story = StoryObj<typeof SearchField>

// wraps the controlled component with local state so typing is interactive in Storybook
function InteractiveSearchField(args: Story['args']) {
    const [value, setValue] = useState(args?.value ?? '')
    return <SearchField {...args} value={value} onChange={(event) => setValue(event.target.value)} />
}

export const Default: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: '',
    },
}

export const WithValue: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: 'repo-radar',
    },
}

export const CustomPlaceholder: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: '',
        placeholder: 'Search repositories...',
    },
}

export const CustomShortcut: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: '',
        shortcutKeys: ['Cmd', 'K'],
    },
}
