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
        hints: [{ keys: ['Cmd', 'K'] }],
    },
}

// e.g. the AppBar while on the Tracked Repos page - each hint gets its own label once there's
// more than one, to tell them apart
export const MultipleHints: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: '',
        hints: [
            { keys: ['Ctrl', 'K'], label: 'to search repos' },
            { keys: ['Ctrl', 'J'], label: 'to search tracked repos' },
        ],
    },
}

// a removable scope tag ahead of the query - e.g. Tracked Repos' default "In Tracked:" filter.
// Backspace removes it once the typed query is itself empty.
export const ScopePill: Story = {
    render: (args) => <InteractiveSearchField {...args} />,
    args: {
        value: '',
        scopePill: { label: 'In Tracked:' },
        onScopePillRemove: () => alert('scope pill removed'),
    },
}
