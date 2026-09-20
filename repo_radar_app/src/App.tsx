import { useRef, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Theme } from '@mui/material'
import { AppBar, Button, ColorModeToggle, LogoIcon } from '@radar-repo/radar-repo-lib'
import type { SearchFieldHint, SearchFieldScopePill } from '@radar-repo/radar-repo-lib'
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone'
import BookmarksTwoToneIcon from '@mui/icons-material/BookmarksTwoTone'
import { useEscapeClearSearch } from './hooks/useEscapeClearSearch'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useRandomInterval } from './hooks/useRandomInterval'
import { useTrackedRepos } from './hooks/api'
import { Homepage } from './pages/Homepage'
import { TrackedRepos } from './pages/TrackedRepos'

type Page = 'home' | 'tracked'
// 'global' hits the GitHub search API (Homepage); 'tracked' filters the already-loaded tracked
// list client-side (TrackedRepos) and is shown as a removable "In Tracked:" pill in the field.
type SearchScope = 'global' | 'tracked'

const LOGO_ANIMATION_MIN_INTERVAL_MS = 10_000 // 10 seconds
const LOGO_ANIMATION_MAX_INTERVAL_MS = 12 * 10_000 // 2 minutes

// detected once at module load - navigator.platform doesn't change during the app's lifetime.
const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const searchShortcutKeys: [string, string] = isMacOS ? ['Cmd', 'K'] : ['Ctrl', 'K']
const trackedSearchShortcutKeys: [string, string] = isMacOS ? ['Cmd', 'J'] : ['Ctrl', 'J']

// shared by both AppBar nav buttons - the selected page's label sits bold with a permanent
// underline, everything else only underlines transiently on hover/focus (same effect, just
// pinned open at width:'70%' instead of width:0 at rest). The startIcon is always mounted (see
// the Button usages below) rather than conditionally rendered, so toggling `selected` animates
// its opacity/width/margin instead of popping it in/out.
function navButtonSx(theme: Theme, selected: boolean) {
  const iconTransition = theme.transitions.create(['opacity', 'width', 'margin-right'])
  return {
    color: 'text.primary',
    fontWeight: selected ? 700 : 500,
    position: 'relative' as const,
    '& .MuiButton-startIcon': {
      opacity: selected ? 1 : 0,
      width: selected ? 20 : 0,
      marginRight: selected ? '8px' : '0px',
      overflow: 'hidden',
      transition: iconTransition,
    },
    '&::after': {
      content: '""',
      position: 'absolute' as const,
      left: '50%',
      bottom: -4,
      width: selected ? '70%' : 0,
      height: 2,
      borderRadius: 1,
      bgcolor: 'text.primary',
      transform: 'translateX(-50%)',
      transition: theme.transitions.create('width'),
    },
    '&:hover::after, &:focus-visible::after': {
      width: '70%',
    },
  }
}

function App() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [searchScope, setSearchScope] = useState<SearchScope>('global')
  const searchRef = useRef<HTMLInputElement>(null)

  // Set true only by the "Tracked Repos" nav button click (the literal "navigated here, haven't
  // touched the search field yet" case) - the field's own onFocus below consumes it once, so a
  // plain click into the field defaults to the [In Tracked:] pill exactly once per such visit,
  // and never overrides a scope the user (or a shortcut) has already deliberately chosen since.
  const pendingTrackedDefaultRef = useRef(true)

  // the single source of truth for tracked repos - both pages read/toggle through this rather
  // than each independently touching localStorage, so they always agree on what's tracked.
  const { data: trackedRepos, trackedKeys, loading: trackedLoading, error: trackedError, untrack, toggleTrack } =
    useTrackedRepos()

  // undefined until the first random-interval tick, deliberately - see LogoIcon's playSignal
  // prop for why a defined value from the start would fire the animation on page load
  const [logoPlaySignal, setLogoPlaySignal] = useState<number>()
  useRandomInterval(
    () => setLogoPlaySignal((n) => (n ?? 0) + 1),
    LOGO_ANIMATION_MIN_INTERVAL_MS,
    LOGO_ANIMATION_MAX_INTERVAL_MS,
  )

  // Homepage debounces `search` itself and resets its own pagination whenever the debounced
  // value changes, so clearing it here is all Escape needs to do.
  useEscapeClearSearch(searchRef, search.trim() !== '', () => setSearch(''))

  // Ctrl+K: always a fresh *global* search, even mid-tracked-search - matches the [In Tracked:]
  // pill's own backspace-to-remove behavior, just reachable from the keyboard too.
  useKeyboardShortcut('k', () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('global')
    setSearch('')
    searchRef.current?.focus()
  })

  // Ctrl+J: jump straight into a tracked-repo search from anywhere, forcing the pill and
  // switching to the Tracked Repos page so there's somewhere for the filtered results to show.
  useKeyboardShortcut('j', () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('tracked')
    setSearch('')
    setPage('tracked')
    searchRef.current?.focus()
  })

  // a global search started while on Tracked Repos has nowhere to render there - silently swap
  // to Homepage the moment it starts, rather than waiting for it to resolve. Adjusting state
  // during render (React's documented "reset state when x changes" pattern) rather than in an
  // effect: once page flips to 'home' this condition is false, so it settles in one extra render.
  if (page === 'tracked' && searchScope === 'global' && search.trim() !== '') {
    setPage('home')
  }

  const searchHints: SearchFieldHint[] =
    page === 'tracked'
      ? [
          { keys: searchShortcutKeys, label: 'to search repos' },
          { keys: trackedSearchShortcutKeys, label: 'to search tracked repos' },
        ]
      : [{ keys: searchShortcutKeys, label: 'to search repos' }]

  const searchScopePill: SearchFieldScopePill | undefined =
    searchScope === 'tracked' ? { label: 'In Tracked:' } : undefined

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        ref={searchRef}
        searchValue={search}
        searchHints={searchHints}
        searchScopePill={searchScopePill}
        onSearchScopePillRemove={() => {
          pendingTrackedDefaultRef.current = false
          setSearchScope('global')
        }}
        onSearchChange={(event) => setSearch(event.target.value)}
        onSearchFocus={() => {
          if (page !== 'tracked' || !pendingTrackedDefaultRef.current) return
          pendingTrackedDefaultRef.current = false
          setSearchScope('tracked')
          setSearch('')
        }}
        start={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <LogoIcon playSignal={logoPlaySignal} sx={{height: 40, width: 40}} />
                <Stack direction="column" spacing={-2}>
                    <Typography variant="h6">Repo</Typography>
                    <Typography variant="h6">Radar</Typography>
                </Stack>
          </Stack>
        }
        end={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              variant="text"
              size="medium"
              label="Homepage"
              startIcon={<HomeTwoToneIcon />}
              onClick={() => {
                setPage('home')
                setSearchScope('global')
                setSearch('')
              }}
              sx={(theme) => navButtonSx(theme, page === 'home')}
            />
            <Button
              variant="text"
              size="medium"
              label="Tracked Repos"
              startIcon={<BookmarksTwoToneIcon />}
              onClick={() => {
                // clears any leftover global query - otherwise the render-time redirect just
                // above (global search + Tracked page -> bounce to Homepage) would immediately
                // fire again and undo this click
                pendingTrackedDefaultRef.current = true
                setSearch('')
                setPage('tracked')
              }}
              sx={(theme) => navButtonSx(theme, page === 'tracked')}
            />
            <ColorModeToggle />
          </Stack>
        }
      />
      {page === 'home' ? (
        <Homepage search={search} trackedKeys={trackedKeys} onToggleTrack={toggleTrack} />
      ) : (
        <TrackedRepos
          search={searchScope === 'tracked' ? search : ''}
          trackedRepos={trackedRepos}
          loading={trackedLoading}
          error={trackedError}
          onUntrack={untrack}
        />
      )}
    </Box>
  )
}

export default App
