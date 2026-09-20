import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

// Focuses the returned ref's element on Ctrl+K (Cmd+K on macOS) - meant to be handed to
// AppBar's forwarded ref, which points at the underlying search <input>. Lives in the app,
// not the lib, since it's a global window-level listener and therefore app behavior, not UI.
// The displayed shortcut hint (Ctrl vs Cmd) is handled separately in App.tsx, since this hook
// already listens for either metaKey or ctrlKey regardless of OS.
export function useCtrlKFocus<T extends HTMLElement>(): RefObject<T | null> {
    const ref = useRef<T>(null)

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const isFocusShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
            if (!isFocusShortcut) return

            event.preventDefault()
            ref.current?.focus()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return ref
}
