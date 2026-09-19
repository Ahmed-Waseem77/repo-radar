import type { ChangeEvent, ReactNode, Ref } from 'react'
import { AppBar as MuiAppBar, Toolbar, Stack, useScrollTrigger } from '@mui/material'
import { SearchField } from './SearchField'
import type { SearchFieldProps } from './SearchField'

export interface AppBarProps {
    // React 19 accepts `ref` as a plain prop on function components - forwardRef is no
    // longer necessary. Forwarded straight through to SearchField's own `ref` prop below,
    // which exposes the underlying search <input> so the app's Ctrl+K hook can focus it.
    ref?: Ref<HTMLInputElement>
    // controlled search value/handler - the app owns debouncing and any data fetching,
    // this component only renders and forwards the raw input event
    searchValue: string
    onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
    searchPlaceholder?: SearchFieldProps['placeholder']
    shortcutKeys?: SearchFieldProps['shortcutKeys']
    // left slot, e.g. logo/title
    start?: ReactNode
    // right slot, e.g. avatar/theme toggle
    end?: ReactNode
    // elevation once the page is scrolled - at scrollTop 0 the bar is always flat and transparent
    elevation?: number
}

export function AppBar({
    ref,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    shortcutKeys,
    start,
    end,
    elevation = 4,
}: AppBarProps) {
    // true once the page has scrolled away from the top - drives both the elevation
    // (shadow) and the background, so the bar reads as "floating" only once it needs to
    // separate itself from content scrolling underneath it.
    const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 0 })

    return (
        <MuiAppBar
            position="sticky"
            // MUI's `color="default"` bakes in a dark-mode-only background via
            // theme.applyStyles('dark', { backgroundColor: theme.vars.palette.AppBar.darkBg }) -
            // that rule has real specificity of its own, so a plain sx `backgroundColor: 'transparent'`
            // loses to it in dark mode even though it wins in light mode. `color="transparent"` is
            // MUI's own variant for this exact case: it also nulls out the dark-mode elevation overlay
            // background-image that Paper normally paints, which a manual override can't reach.
            color="transparent"
            elevation={scrolled ? elevation : 0}
            sx={(theme) => ({
                bgcolor: scrolled ? 'background.paper' : 'transparent',
                transition: theme.transitions.create(['background-color', 'box-shadow']),
            })}
        >
            <Toolbar sx={{ gap: 2 }}>
                {start && <Stack direction="row" sx={{ alignItems: 'center', flexShrink: 0 }}>{start}</Stack>}
                <Stack direction="row" sx={{ flex: 1, justifyContent: 'center' }}>
                    <SearchField
                        ref={ref}
                        value={searchValue}
                        onChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        shortcutKeys={shortcutKeys}
                        sx={{ width: '100%', maxWidth: 480 }}
                    />
                </Stack>
                {end && <Stack direction="row" sx={{ alignItems: 'center', flexShrink: 0 }}>{end}</Stack>}
            </Toolbar>
        </MuiAppBar>
    )
}
