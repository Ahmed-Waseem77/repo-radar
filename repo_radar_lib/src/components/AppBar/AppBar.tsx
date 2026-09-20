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
            {/* a flex middle child only centers WITHIN the leftover space between start/end -
                if they're different widths (e.g. logo+title vs. buttons), that leftover space
                isn't symmetric around the bar's true center, so the search field drifts off it.
                A grid with two equal 1fr outer tracks keeps the middle column's center pinned to
                the bar's actual center regardless of how wide start/end each are. */}
            <Toolbar
                sx={{
                    display: 'grid',
                    // the middle column is a concrete size (not `auto`) rather than one sized to
                    // its content: SearchField's width:'100%' is a percentage, and a percentage
                    // against a content-sized (`auto`) track is circular/indeterminate, which
                    // silently breaks its focus-triggered max-width growth. 560 matches
                    // SearchField's own focused max-width, so the column always has enough room
                    // reserved for the expanded state - the field's own maxWidth transition (480
                    // resting -> 560 focused) does the actual animating within that fixed space.
                    gridTemplateColumns: 'minmax(min-content, 1fr) minmax(0, 560px) minmax(min-content, 1fr)',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Stack direction="row" sx={{ gridColumn: '1', alignItems: 'center', minWidth: 0 }}>
                    {start}
                </Stack>
                <Stack direction="row" sx={{ gridColumn: '2', justifyContent: 'center' }}>
                    <SearchField
                        ref={ref}
                        value={searchValue}
                        onChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        shortcutKeys={shortcutKeys}
                        sx={{ width: '100%', maxWidth: 480 }}
                    />
                </Stack>
                <Stack direction="row" sx={{ gridColumn: '3', alignItems: 'center', minWidth: 0, justifyContent: 'flex-end' }}>
                    {end}
                </Stack>
            </Toolbar>
        </MuiAppBar>
    )
}
