import type { ChangeEvent, FormEvent, KeyboardEvent, Ref } from 'react'
import { Paper, InputBase, Stack } from '@mui/material'
import type { PaperProps } from '@mui/material'
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone'
import InlineCode from '../Text/InlineCode'

export interface SearchFieldProps extends Omit<PaperProps, 'onChange'> {
    // React 19 accepts `ref` as a plain prop on function components - forwardRef is no
    // longer necessary.
    // https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop

    // It still needs declaring here since MUI's PaperProps doesn't carry
    // one of its own (ref is handled separately by OverridableComponent there).
    ref?: Ref<HTMLInputElement>
    value: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    // labels shown as InlineCode tags hinting the focus shortcut - defaults to the Ctrl+K
    // binding the app wires up via a global keydown listener, but is overridable (e.g. Cmd/K)
    shortcutKeys?: [string, string]
}

// exposes the underlying search <input> so the app's Ctrl+K hook can call .focus() on it
// imperatively without this component needing to know anything about hotkeys itself.
export function SearchField({
    ref,
    value,
    onChange,
    placeholder = 'Search',
    shortcutKeys = ['Ctrl', 'K'],
    sx,
    ...props
}: SearchFieldProps) {
    return (
        <Paper
            component="form"
            onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
            variant="outlined"
            {...props}
            sx={[
                (theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing(1),
                    padding: theme.spacing(0.5, 1.5),
                    // sx's `borderRadius` treats a bare number as a *multiplier* of
                    // theme.shape.borderRadius (like spacing), not a literal px value - an explicit
                    // unit is needed to use the theme's radius as-is instead of radius * radius.
                    borderRadius: `${theme.shape.borderRadius}px`,
                    transition: theme.transitions.create(['border-color', 'max-width']),
                    // the <input> is what actually receives focus, not this Paper/form itself -
                    // :focus-within reacts to a focused descendant instead. `text.primary` is the
                    // theme's own dark/light swap (near-black in light mode, near-white in dark),
                    // so this stays theme-aware without a manual light/dark branch. A modest,
                    // fixed max-width bump (not 100%) reads as "growing to make room for typing"
                    // rather than lunging to fill the whole bar - the caller's own sx (e.g.
                    // AppBar's maxWidth: 480) still governs the resting width it shrinks back to.
                    '&:focus-within': {
                        borderColor: 'text.primary',
                        maxWidth: 560,
                    },
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <SearchTwoToneIcon sx={{ color: 'text.secondary' }} fontSize="small" />
            <InputBase
                inputRef={ref}
                value={value}
                onChange={onChange}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Escape') {
                        event.currentTarget.blur()
                    }
                }}
                placeholder={placeholder}
                sx={{ flex: 1, fontSize: 'body2.fontSize' }}
                inputProps={{ 'aria-label': placeholder }}
            />
            {/* hides once the user starts typing so the hint doesn't compete with the query */}
            {value.length === 0 && (
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <InlineCode color="secondary">{shortcutKeys[0]}</InlineCode>
                    <InlineCode color="secondary">{shortcutKeys[1]}</InlineCode>
                </Stack>
            )}
        </Paper>
    )
}
