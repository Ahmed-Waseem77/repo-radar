import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Box, Typography } from '@mui/material'
import { Button } from '../Button/Button.tsx'
import { AppBar } from './AppBar'

const meta: Meta<typeof AppBar> = {
    title: 'Components/AppBar',
    component: AppBar,
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        hideSearch: { control: 'boolean' },
    },
}
export default meta

type Story = StoryObj<typeof AppBar>

// wraps the controlled component with local state so typing is interactive in Storybook, and
// renders tall filler content below so the scroll-elevation behavior is actually demonstrable
function InteractiveAppBar(args: Story['args']) {
    const [value, setValue] = useState(args?.searchValue ?? '')
    return (
        <Box>
            <AppBar {...args} searchValue={value} onSearchChange={(event) => setValue(event.target.value)} />
            <Box sx={{ p: 4 }}>
                <Typography>Scroll down to see the AppBar pick up a background and elevation.</Typography>
                <Box sx={{ height: '150vh' }} />
            </Box>
        </Box>
    )
}

export const Default: Story = {
    render: (args) => <InteractiveAppBar {...args} />,
    args: {
        searchValue: '',
    },
}

export const WithSlots: Story = {
    render: (args) => <InteractiveAppBar {...args} />,
    args: {
        searchValue: '',
        start: <Typography variant="h6">Repo Radar</Typography>,
        end: (
            <Button
                variant='text'
                size='medium'
                label='Tracked Repos'
                sx={(theme) => ({
                    color: 'text.primary',
                    fontWeight: 700,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: '50%',
                        bottom: 6,
                        width: 0,
                        height: 2,
                        borderRadius: 1,
                        bgcolor: 'text.primary',
                        transform: 'translateX(-50%)',
                        transition: theme.transitions.create('width'),
                    },
                    '&:hover::after, &:focus-visible::after': {
                        width: '70%',
                    },
                })}
            />
        ),
    },
}

// e.g. a narrow screen, where search moves into its own separate bar lower on the page instead
// of squeezing into this one - start/end sit at the two edges with no reserved middle column
export const HideSearch: Story = {
    render: (args) => <InteractiveAppBar {...args} />,
    args: {
        ...WithSlots.args,
        hideSearch: true,
    },
}
