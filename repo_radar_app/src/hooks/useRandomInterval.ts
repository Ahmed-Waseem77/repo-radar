import { useEffect, useRef } from 'react'

// Fires `callback` on its own schedule: each gap between firings is a fresh random duration
// between minMs and maxMs, re-rolled after every firing (not a fixed interval). `callback` is
// read via a ref, updated every render without re-triggering the effect, so a parent re-
// rendering with a new inline callback (e.g. on every keystroke) doesn't tear down and restart
// the in-progress wait - only minMs/maxMs actually changing does that.
export function useRandomInterval(callback: () => void, minMs: number, maxMs: number) {
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    })

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>

        function scheduleNext() {
            const delay = minMs + Math.random() * (maxMs - minMs)
            timeoutId = setTimeout(() => {
                callbackRef.current()
                scheduleNext()
            }, delay)
        }

        scheduleNext()

        return () => clearTimeout(timeoutId)
    }, [minMs, maxMs])
}
