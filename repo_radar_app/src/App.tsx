import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Collapse, Fade, IconButton, Stack, Typography } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import type { Theme } from '@mui/material'
import { AppBar, Button, ColorModeToggle, InlineCode, LogoIcon } from '@radar-repo/radar-repo-lib'
import type { SearchFieldHint, SearchFieldScopePill } from '@radar-repo/radar-repo-lib'
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone'
import BookmarksTwoToneIcon from '@mui/icons-material/BookmarksTwoTone'
import ChevronLeftTwoToneIcon from '@mui/icons-material/ChevronLeftTwoTone'
import { useEscapeAction } from './hooks/useEscapeAction'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useRandomInterval } from './hooks/useRandomInterval'
import { useTrackedRepos } from './hooks/api'
import { Homepage } from './pages/Homepage'
import { TrackedRepos } from './pages/TrackedRepos'
import type { RepoDto } from './api/github/mappers'

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
  const [selectedRepo, setSelectedRepo] = useState<RepoDto | null>(null)
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

  // Opening the detail view pushes a plain (same-URL) history entry so the browser's back button
  // closes it and returns to whatever the underlying page already looked like, rather than
  // leaving the SPA entirely. Selecting a DIFFERENT repo while it's already open replaces that
  // entry instead of pushing another - one back-button press always exits the view outright,
  // regardless of how many repos were viewed inside it via the side panel.
  //
  // Every programmatic close path (nav buttons, Escape) goes through `closeDetailView`, which
  // clears the state immediately (so e.g. switching pages via a nav button never shows a flash of
  // the OTHER page's detail view for a frame while `history.back()`'s popstate is still pending)
  // AND calls `history.back()`, so the pushed entry is actually consumed - otherwise a later, real
  // back-button press would see that stale entry and try to "close" a view that's already closed.
  // A real back-button press (not routed through `closeDetailView` at all) is caught by the
  // popstate listener below; setting already-null state there is a harmless no-op.
  const selectRepo = useCallback(
    (repo: RepoDto) => {
      if (selectedRepo === null) {
        window.history.pushState({ repoDetail: true }, '')
      } else {
        window.history.replaceState({ repoDetail: true }, '')
      }
      setSelectedRepo(repo)
    },
    [selectedRepo],
  )

  const closeDetailView = useCallback(() => {
    if (selectedRepo !== null) {
      setSelectedRepo(null)
      window.history.back()
    }
  }, [selectedRepo])

  useEffect(() => {
    function handlePopState() {
      setSelectedRepo(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // undefined until the first random-interval tick, deliberately - see LogoIcon's playSignal
  // prop for why a defined value from the start would fire the animation on page load
  const [logoPlaySignal, setLogoPlaySignal] = useState<number>()
  useRandomInterval(
    () => setLogoPlaySignal((n) => (n ?? 0) + 1),
    LOGO_ANIMATION_MIN_INTERVAL_MS,
    LOGO_ANIMATION_MAX_INTERVAL_MS,
  )

  // Both Escape and the AppBar's back button (below) trigger this same "step back" action: close
  // an open detail view if there's one, otherwise clear an active search if there's one. Detail
  // view takes priority since it's the more "local" thing to undo first. Homepage debounces
  // `search` itself and resets its own pagination whenever the debounced value changes, so
  // clearing it here is all that's needed on that side.
  const hasBackAction = selectedRepo !== null || search.trim() !== ''
  const handleBack = useCallback(() => {
    if (selectedRepo !== null) closeDetailView()
    else setSearch('')
  }, [selectedRepo, closeDetailView])

  useEscapeAction(searchRef, [{ isActive: hasBackAction, onTrigger: handleBack }])

  // Ctrl+K: always a fresh *global* search, even mid-tracked-search - matches the [In Tracked:]
  // pill's own backspace-to-remove behavior, just reachable from the keyboard too. Deliberately
  // does NOT close an open detail view - it stays open, same page, with its side panel just
  // reflecting the reset (now query-less) search, exactly like plain typing already does.
  useKeyboardShortcut('k', () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('global')
    setSearch('')
    searchRef.current?.focus()
  })

  // Ctrl+J: jump straight into a tracked-repo search from anywhere, forcing the pill and
  // switching to the Tracked Repos page so there's somewhere for the filtered results to show.
  // Also deliberately leaves an open detail view alone, matching Ctrl+K above.
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
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            {/* horizontal Collapse (growing/shrinking width), not a crossfade - the back
                button+hint slides INTO place, pushing the logo rightward as it grows, and the logo
                slides back to its resting position as it shrinks away, rather than the two dissolving
                into each other in place. No spacing on THIS inner Stack: the gap before the logo is
                the collapsing content's own trailing padding (below), so it shrinks to true zero -
                otherwise a fixed gap here would leave the logo sitting slightly right of its resting
                spot even while collapsed. Kept as its own group (rather than flattened into the outer
                Stack's spacing) so the nav buttons below get normal, unaffected spacing. */}
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              <Collapse orientation="horizontal" in={hasBackAction}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', pr: 1.5 }}>
                  <IconButton onClick={handleBack} aria-label="Back" size="small">
                    <ChevronLeftTwoToneIcon />
                  </IconButton>
                  <InlineCode color="secondary">Esc</InlineCode>
                </Stack>
              </Collapse>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <LogoIcon playSignal={logoPlaySignal} sx={{ height: 40, width: 40 }} />
                <Stack direction="column" spacing={-2}>
                  <Typography variant="h6">Repo</Typography>
                  <Typography variant="h6">Radar</Typography>
                </Stack>
              </Stack>
            </Stack>
            <Button
              variant="text"
              size="medium"
              label="Homepage"
              startIcon={<HomeTwoToneIcon />}
              onClick={() => {
                setPage('home')
                setSearchScope('global')
                setSearch('')
                closeDetailView()
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
                closeDetailView()
                setPage('tracked')
              }}
              sx={(theme) => navButtonSx(theme, page === 'tracked')}
            />
          </Stack>
        }
        end={<ColorModeToggle />}
      />
      {/* position:relative + each transitioning child pinned via inset:0 is what makes this a
          true crossfade rather than a fade-in-only: TransitionGroup keeps the OUTGOING keyed
          child mounted (playing its own exit) for the same `timeout` while the INCOMING one
          mounts and plays its enter, so both are on screen briefly - inset:0 stacks them exactly
          on top of each other instead of the second one just appearing below/after the first in
          normal flex flow. */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <TransitionGroup component={null}>
          <Fade key={page} timeout={225}>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              {page === 'home' ? (
                <Homepage
                  search={search}
                  trackedKeys={trackedKeys}
                  onToggleTrack={toggleTrack}
                  selectedRepo={selectedRepo}
                  onSelectRepo={selectRepo}
                />
              ) : (
                <TrackedRepos
                  search={searchScope === 'tracked' ? search : ''}
                  trackedRepos={trackedRepos}
                  loading={trackedLoading}
                  error={trackedError}
                  onUntrack={untrack}
                  onToggleTrack={toggleTrack}
                  selectedRepo={selectedRepo}
                  onSelectRepo={selectRepo}
                />
              )}
            </Box>
          </Fade>
        </TransitionGroup>
      </Box>
    </Box>
  )
}

export default App
