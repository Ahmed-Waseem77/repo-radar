import type { ChangeEvent, FocusEvent, FormEvent, KeyboardEvent, MouseEvent, Ref } from 'react'
import { Fragment, useCallback, useRef, useState } from 'react'
import { Paper, InputBase, Stack, Typography, Fade } from '@mui/material'
import type { PaperProps } from '@mui/material'
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone'
import InlineCode from '../Text/InlineCode'
import { Pill } from '../Text/Pill'

// a single "Ctrl K"-style hint - `label` is optional plain-text context after the keys (e.g.
// "to search repos"), needed once there's more than one hint to tell them apart; the lone
// default hint omits it and just shows the bare keys, as before.
export interface SearchFieldHint {
    keys: [string, string]
    label?: string
}

// a removable tag rendered inside the field ahead of the actual query text (e.g. "In Tracked:")
// - scoping the search to something other than a plain global query. SearchField only renders
// it and reports backspace-to-remove; owning what the scope actually means is the app's job.
export interface SearchFieldScopePill {
    label: string
}

export interface SearchFieldProps extends Omit<PaperProps, 'onChange'> {
    // React 19 accepts `ref` as a plain prop on function components - forwardRef is no
    // longer necessary.
    // https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop

    // It still needs declaring here since MUI's PaperProps doesn't carry
    // one of its own (ref is handled separately by OverridableComponent there).
    ref?: Ref<HTMLInputElement>
    value: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    onFocus?: (event: FocusEvent<HTMLInputElement>) => void
    placeholder?: string
    // hints shown as InlineCode tags (optionally followed by their own label) when the field is
    // empty and no scope pill is active - defaults to a single bare Ctrl+K hint.
    hints?: SearchFieldHint[]
    scopePill?: SearchFieldScopePill
    // fired when Backspace is pressed while the field is empty and a scope pill is showing -
    // the app decides what removing it actually means (e.g. falling back to a global search).
    onScopePillRemove?: () => void
}

const DEFAULT_HINTS: SearchFieldHint[] = [{ keys: ['Ctrl', 'K'] }]

// exposes the underlying search <input> so the app's keyboard-shortcut hooks can call .focus()
// on it imperatively without this component needing to know anything about hotkeys itself.
export function SearchField({
    ref,
    value,
    onChange,
    onFocus,
    placeholder = 'Search',
    hints = DEFAULT_HINTS,
    scopePill,
    onScopePillRemove,
    sx,
    ...props
}: SearchFieldProps) {
    // Fade's unmountOnExit keeps the Pill mounted (just animating opacity) while it exits, but
    // the Pill's own props update immediately regardless - passing `scopePill` straight through
    // would blank the label out the instant Backspace removes it, so the exit plays as an empty
    // shape fading rather than the "In Tracked:" text fading. Remembering the last non-empty
    // pill (derived during render, React's documented "adjust state on a prop change" pattern -
    // not in an effect, so there's no extra render/flash) keeps the label showing throughout the
    // fade; `in={Boolean(scopePill)}` below still governs visibility/mounting.
    const [lastScopePill, setLastScopePill] = useState(scopePill)
    if (scopePill && scopePill.label !== lastScopePill?.label) {
        setLastScopePill(scopePill)
    }

    const inputRef = useRef<HTMLInputElement>(null)

    // InputBase's `inputRef` only takes one ref, but this component needs the actual input node
    // for its own click-to-focus handling below AND has to keep forwarding whatever ref the
    // caller (the app's keyboard-shortcut hooks) passed in. The refs are only ever written here,
    // inside the callback React invokes on attach/detach - never read during render - which is
    // what keeps this clear of react-hooks/refs (a plain helper that took refs as arguments and
    // wrote to them would still trip it, since the rule can't verify what the callee does with
    // them).
    const setInputRef = useCallback(
        (node: HTMLInputElement | null) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
        },
        [ref],
    )

    return (
        <Paper
            component="form"
            onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}
            variant="outlined"
            // the icon, scope pill, and shortcut hints are inert (pointerEvents:none below) -
            // clicking anywhere they'd otherwise sit, or on the field's own padding, should still
            // behave like clicking the input itself rather than silently doing nothing.
            // preventDefault stops that mousedown from doing anything else (e.g. text selection)
            // first; skipped when the input itself is the target so its own native
            // click-to-place-caret behavior isn't disturbed.
            onMouseDown={(event: MouseEvent<HTMLFormElement>) => {
                if (event.target === inputRef.current) return
                event.preventDefault()
                inputRef.current?.focus()
            }}
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
            <SearchTwoToneIcon sx={{ color: 'text.secondary', flexShrink: 0, pointerEvents: 'none' }} fontSize="small" />
            <Fade in={Boolean(scopePill)} unmountOnExit>
                <Pill
                    size="small"
                    shape="rounded"
                    variant="secondary"
                    label={lastScopePill?.label ?? ''}
                    sx={{ flexShrink: 0, pointerEvents: 'none', userSelect: 'none' }}
                />
            </Fade>
            <InputBase
                inputRef={setInputRef}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Escape') {
                        event.currentTarget.blur()
                        return
                    }
                    // mirrors how tag/chip inputs (e.g. Gmail's recipient field) treat Backspace:
                    // it only reaches for the pill once the typed text itself is already empty,
                    // so it never eats characters the user is still deleting.
                    if (event.key === 'Backspace' && value === '' && scopePill && onScopePillRemove) {
                        event.preventDefault()
                        onScopePillRemove()
                    }
                }}
                placeholder={placeholder}
                sx={{ flex: 1, fontSize: 'body2.fontSize', minWidth: 0 }}
                inputProps={{ 'aria-label': placeholder }}
            />
            {/* hides once the user starts typing, or a scope pill takes over that role, so the
                hint doesn't compete with the query */}
            <Fade in={value.length === 0 && !scopePill} unmountOnExit>
                <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{
                        flexShrink: 0,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    {hints.map((hint, index) => (
                        <Fragment key={`${hint.keys[0]}-${hint.keys[1]}`}>
                            {index > 0 && (
                                <Typography variant="caption" color="textDimmedInverted">,</Typography>
                            )}
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
                                <InlineCode color="secondary">{hint.keys[0]}</InlineCode>
                                <InlineCode color="secondary">{hint.keys[1]}</InlineCode>
                                {hint.label && (
                                    <Typography variant="caption" color="textDimmedInverted" sx={{ whiteSpace: 'nowrap' }}>
                                        {hint.label}
                                    </Typography>
                                )}
                            </Stack>
                        </Fragment>
                    ))}
                </Stack>
            </Fade>
        </Paper>
    )
}
