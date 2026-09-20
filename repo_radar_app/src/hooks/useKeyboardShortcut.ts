import { useEffect, useRef } from 'react'

// Fires `handler` on Ctrl+<key> (Cmd+<key> on macOS), preventing the browser's own binding for
// it. Lives in the app, not the lib, since a global window-level listener is app behavior, not
// UI - the lib components it drives (e.g. AppBar's search field) stay ignorant of hotkeys
// entirely. Generic over the key so both the K (focus/global-search) and T (tracked-search)
// bindings share one implementation instead of two near-identical listeners.
export function useKeyboardShortcut(key: string, handler: () => void) {
    // read via a ref rather than depending on `handler` directly, so a caller re-rendering with
    // a new inline handler doesn't tear down and re-add the document listener every render.
    const handlerRef = useRef(handler)

    useEffect(() => {
        handlerRef.current = handler
    })

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const isMatch = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key.toLowerCase()
            if (!isMatch) return

            event.preventDefault()
            handlerRef.current()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [key])
}
