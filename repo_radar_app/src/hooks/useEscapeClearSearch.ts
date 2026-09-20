import { useEffect } from 'react'
import type { RefObject } from 'react'

// Escape has two jobs depending on what's focused when it's pressed:
// - if the search input is focused, SearchField's own Escape handler (in the lib) blurs it -
//   this hook just needs to stay out of the way on that press
// - once the input is no longer focused, a second Escape clears an active search and returns
//   to the original (empty) view
//
// Registered on the CAPTURE phase specifically: a plain bubble-phase document listener would
// run after SearchField's own blur-on-Escape handler already fired (React's synthetic bubble
// listeners sit closer to the target than a raw document listener in the bubble chain), so by
// the time it checked document.activeElement the field would already show as blurred - making
// every "just unfocus" press incorrectly also clear the search. Capture fires before that,
// seeing the true pre-blur focus state. Lives in the app, not the lib, since clearing a search
// is app state/behavior, not UI.
export function useEscapeClearSearch(
    searchRef: RefObject<HTMLElement | null>,
    hasActiveSearch: boolean,
    onClear: () => void,
) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return
            if (document.activeElement === searchRef.current) return
            if (hasActiveSearch) onClear()
        }

        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [searchRef, hasActiveSearch, onClear])
}
