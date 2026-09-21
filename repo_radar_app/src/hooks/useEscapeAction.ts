import { useEffect } from 'react'
import type { RefObject } from 'react'

export interface EscapeAction {
    isActive: boolean
    onTrigger: () => void
}

// Escape has more than one possible job depending on what's open/focused when it's pressed:
// - if the search input is focused, SearchField's own Escape handler (in the lib) blurs it -
//   this hook just needs to stay out of the way on that press
// - otherwise, the first active action in priority order fires (e.g. "close the open detail
//   view" before "clear an active search") - only one action ever fires per press
//
// Registered on the CAPTURE phase specifically: a plain bubble-phase document listener would
// run after SearchField's own blur-on-Escape handler already fired (React's synthetic bubble
// listeners sit closer to the target than a raw document listener in the bubble chain), so by
// the time it checked document.activeElement the field would already show as blurred - making
// every "just unfocus" press incorrectly also trigger an action. Capture fires before that,
// seeing the true pre-blur focus state. Lives in the app, not the lib, since what Escape does
// beyond "unfocus the field" is app state/behavior, not UI.
export function useEscapeAction(searchRef: RefObject<HTMLElement | null>, actions: EscapeAction[]) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return
            if (document.activeElement === searchRef.current) return
            actions.find((action) => action.isActive)?.onTrigger()
        }

        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [searchRef, actions])
}
