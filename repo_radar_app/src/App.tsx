import { useCallback, useEffect, useRef, useState } from 'react'
import { AppBar as MuiAppBar, Box, Collapse, Fade, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import { TransitionGroup } from 'react-transition-group'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Theme } from '@mui/material'
import { AppBar, Button, ColorModeToggle, InlineCode, LogoIcon, SearchField } from '@radar-repo/radar-repo-lib'
import type { SearchFieldHint, SearchFieldScopePill } from '@radar-repo/radar-repo-lib'
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone'
import BookmarksTwoToneIcon from '@mui/icons-material/BookmarksTwoTone'
import ChevronLeftTwoToneIcon from '@mui/icons-material/ChevronLeftTwoTone'
import { RefreshButton } from './components/RepoDetail'
import type { RefreshButtonProps } from './components/RepoDetail'
import { useEscapeAction } from './hooks/useEscapeAction'
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut'
import { useNarrowScreen } from './hooks/useNarrowScreen'
import { useRandomInterval } from './hooks/useRandomInterval'
import { useTrackedRepos } from './hooks/api'
import { Homepage } from './pages/Homepage'
import { TrackedRepos } from './pages/TrackedRepos'
import { RepoDetailPage } from './pages/RepoDetailPage'
import { NotFoundPage } from './pages/NotFoundPage'
import type { RepoDto } from './api/github/mappers'

// 'other' covers any unmatched route (the 404 page) - neither nav button highlights there,
// which is correct: you're on neither of these pages. 'repoDetail' is its own case (rather than
// folding into 'other') purely so the AppBar-visibility check below can tell it apart from a
// genuine 404 - the repo detail page still wants the normal AppBar/search/nav chrome above it.
type Page = 'home' | 'tracked' | 'repoDetail' | 'other'
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
  const location = useLocation()
  const navigate = useNavigate()
  // single breakpoint driving every responsive decision in this file - see the hook itself for
  // why 'md'. RepoDetailView reads its own copy of this same hook for its own layout, rather than
  // this being threaded down as a prop - it's a media query, not app state.
  const narrow = useNarrowScreen()
  const page: Page =
    location.pathname === '/tracked'
      ? 'tracked'
      : location.pathname === '/'
        ? 'home'
        : location.pathname.startsWith('/repos/')
          ? 'repoDetail'
          : 'other'

  const [search, setSearch] = useState('')
  const [searchScope, setSearchScope] = useState<SearchScope>('global')
  const [selectedRepo, setSelectedRepo] = useState<RepoDto | null>(null)
  // narrow-screen-only: whether RepoDetailView's side panel is showing as a search-results
  // overlay (see the render below and handleBack) - a plain toggle rather than being derived
  // straight from `search` itself, so typing a query doesn't pop the overlay open on its own;
  // only the back button does that (see handleBack).
  const [searchPanelOpen, setSearchPanelOpen] = useState(false)
  // narrow-screen-only: the currently-open repo detail page's own refresh control, reported up
  // via RepoDetailPage's onRefreshControlsChange so it can render in the AppBar's end slot
  // (beside the theme toggle) instead of inside the page content - see the render below.
  const [repoRefreshControls, setRepoRefreshControls] = useState<RefreshButtonProps | null>(null)
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

  // Opening the detail view is now a REAL navigation, to /repos/{owner}/{repo} (RepoDetailPage) -
  // no more raw window.history.pushState/replaceState + a manual popstate listener, since
  // react-router's own location/navigate already gives the exact same properties for free once
  // the URL genuinely changes: a `push` here means one browser-back press returns to wherever the
  // list page already was, and `replace` (selecting a DIFFERENT repo while one is already open,
  // e.g. via the side panel) keeps that at exactly one entry no matter how many repos were viewed
  // that way - useLocation() reacting to a real back-button press is what closes the view then,
  // no separate listener needed.
  //
  // `selectedRepo` itself still exists purely as a same-render CACHE: the common case (a click,
  // which already has the full RepoDto in hand) skips RepoDetailPage's own fetch entirely rather
  // than throwing that object away and re-requesting it a moment later. It's read once, by
  // whichever RepoDetailPage instance mounts right after this call - see the effect below for why
  // it doesn't linger past that.
  const selectRepo = useCallback(
    (repo: RepoDto) => {
      setSelectedRepo(repo)
      // opening a repo (from Homepage/TrackedRepos, possibly with a search still active - the
      // query itself is left alone, it still drives the newly-opened page's own side panel/
      // overlay content) must never itself reveal the narrow-screen search overlay - only an
      // explicit back-button press from within the detail view does that (see handleBack).
      // Without this, a leftover `true` from whatever repo was open before this click could
      // otherwise carry straight over into the new one.
      setSearchPanelOpen(false)
      navigate(`/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.title)}`, { replace: page === 'repoDetail' })
    },
    [navigate, page],
  )

  const closeDetailView = useCallback(() => {
    if (page === 'repoDetail') navigate(-1)
  }, [page, navigate])

  // clears the same-render cache above once its own page is no longer showing - not load-bearing
  // (RepoDetailPage already falls back to fetching fresh the moment cachedRepo's owner/name stop
  // matching the URL), just tidiness. Adjusted during render (React's documented pattern for
  // "reset state when a derived value changes") rather than in an effect, matching how Homepage
  // resets its own pagination when its debounced search changes - this has no external system to
  // synchronize with, so a plain effect would just be a slower, indirect way to do the same thing.
  if (page !== 'repoDetail' && selectedRepo !== null) {
    setSelectedRepo(null)
  }

  // same "adjust state during render" reset as selectedRepo above - leaving either page or an
  // active search behind should always leave the overlay/refresh-control state behind with it,
  // rather than a stale true/non-null value lingering for the next repo/page to accidentally
  // inherit.
  if ((page !== 'repoDetail' || search.trim() === '') && searchPanelOpen) {
    setSearchPanelOpen(false)
  }
  if (page !== 'repoDetail' && repoRefreshControls !== null) {
    setRepoRefreshControls(null)
  }

  // undefined until the first random-interval tick, deliberately - see LogoIcon's playSignal
  // prop for why a defined value from the start would fire the animation on page load
  const [logoPlaySignal, setLogoPlaySignal] = useState<number>()
  useRandomInterval(
    () => setLogoPlaySignal((n) => (n ?? 0) + 1),
    LOGO_ANIMATION_MIN_INTERVAL_MS,
    LOGO_ANIMATION_MAX_INTERVAL_MS,
  )

  // Both Escape and the AppBar's back button (below) trigger this same "step back" action.
  // On a narrow screen with an active search while viewing a repo, that means toggling
  // RepoDetailView's side panel open as a search-results overlay (see the render below) rather
  // than immediately leaving the page - typing a query alone deliberately doesn't show it (see
  // searchPanelOpen above), only this does. Pressed again, it toggles the overlay back off
  // without leaving the page either, since the query itself is still there to act on. On a wide
  // screen the side panel is just a permanent column, so none of this applies there - closing an
  // open detail view stays the priority, as before, and otherwise this just clears the search.
  const hasBackAction = page === 'repoDetail' || search.trim() !== ''
  const handleBack = useCallback(() => {
    if (narrow && page === 'repoDetail' && search.trim() !== '') {
      setSearchPanelOpen((open) => !open)
      return
    }
    if (page === 'repoDetail') closeDetailView()
    else setSearch('')
  }, [narrow, page, search, closeDetailView])

  useEscapeAction(searchRef, [{ isActive: hasBackAction, onTrigger: handleBack }])

  // Ctrl+K: always a fresh *global* search, even mid-tracked-search - matches the [In Tracked:]
  // pill's own backspace-to-remove behavior, just reachable from the keyboard too. Deliberately
  // does NOT navigate - an open repo detail page stays open, same URL, with its side panel just
  // reflecting the reset (now query-less) search via `searchScope`/`search` (see
  // RepoDetailPage/useSidePanelRepos), exactly like plain typing already does; and from Home or
  // Tracked, this is already all that's needed (the effect below handles bouncing off Tracked).
  useKeyboardShortcut('k', () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('global')
    setSearch('')
    searchRef.current?.focus()
  })

  // Ctrl+J: jump straight into a tracked-repo search. From Home or Tracked, that means actually
  // navigating to the Tracked page so there's somewhere for the filtered results to show; from the
  // repo detail page, there already is somewhere (its side panel), so this deliberately leaves it
  // open instead, matching Ctrl+K above.
  useKeyboardShortcut('j', () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('tracked')
    setSearch('')
    if (page !== 'repoDetail') navigate('/tracked')
    searchRef.current?.focus()
  })

  // a global search started while on Tracked Repos has nowhere to render there - silently swap
  // to Homepage the moment it starts, rather than waiting for it to resolve. navigate() is a real
  // side effect (unlike a plain setState call), so - now that it drives this instead of a local
  // `page` state - this has to live in an effect rather than the render body itself.
  useEffect(() => {
    if (page === 'tracked' && searchScope === 'global' && search.trim() !== '') {
      navigate('/')
    }
  }, [page, searchScope, search, navigate])

  const searchHints: SearchFieldHint[] =
    page === 'tracked'
      ? [
          { keys: searchShortcutKeys, label: 'to search repos' },
          { keys: trackedSearchShortcutKeys, label: 'to search tracked repos' },
        ]
      : [{ keys: searchShortcutKeys, label: 'to search repos' }]

  const searchScopePill: SearchFieldScopePill | undefined =
    searchScope === 'tracked' ? { label: 'In Tracked:' } : undefined

  // shared by both SearchFields that can be mounted (the top AppBar's on a wide screen, the
  // bottom bar's on a narrow one - see the render below) - only one of the two is ever actually
  // rendered at a time, but the behavior itself doesn't depend on which.
  const handleSearchFocus = () => {
    if (page !== 'tracked' || !pendingTrackedDefaultRef.current) return
    pendingTrackedDefaultRef.current = false
    setSearchScope('tracked')
    setSearch('')
  }
  const handleScopePillRemove = () => {
    pendingTrackedDefaultRef.current = false
    setSearchScope('global')
  }
  const goHome = () => {
    navigate('/')
    setSearchScope('global')
    setSearch('')
  }
  const goTracked = () => {
    // clears any leftover global query - otherwise the render-time redirect just above (global
    // search + Tracked page -> bounce to Homepage) would immediately fire again and undo this click
    pendingTrackedDefaultRef.current = true
    setSearch('')
    navigate('/tracked')
  }
  // stable identity so RepoDetailPage's own effect (reporting its refresh state up here) only
  // re-fires when that state actually changes, not on every App re-render.
  const handleRefreshControlsChange = useCallback((controls: RefreshButtonProps | null) => {
    setRepoRefreshControls(controls)
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* omitted entirely on the 404 page - it has its own full-bleed hex-grid background and
          doesn't need the normal chrome above it. The search field ref still just goes unset in
          that case, which every consumer (useEscapeAction, searchRef.current?.focus()) already
          handles as a harmless no-op. */}
      {page !== 'other' && (
      <AppBar
        ref={searchRef}
        hideSearch={narrow}
        searchValue={search}
        searchHints={searchHints}
        searchScopePill={searchScopePill}
        onSearchScopePillRemove={handleScopePillRemove}
        onSearchChange={(event) => setSearch(event.target.value)}
        onSearchFocus={handleSearchFocus}
        start={
          <Stack direction="row" spacing={narrow ? 1 : 2} sx={{ alignItems: 'center' }}>
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
                  {/* a keyboard-shortcut hint has nothing to say on a touch device, which is the
                      entire reason a screen is "narrow" here in the first place */}
                  {!narrow && <InlineCode color="secondary">Esc</InlineCode>}
                </Stack>
              </Collapse>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <LogoIcon playSignal={logoPlaySignal} sx={{ height: 40, width: 40 }} />
                {/* the "Repo/Radar" wordmark is the first thing to go on a narrow screen - the
                    logo alone is enough to identify the app, and the room it frees up is what
                    keeps the nav buttons/back chevron from wrapping or crowding the color toggle */}
                {!narrow && (
                  <Stack direction="column" spacing={-2}>
                    <Typography variant="h6">Repo</Typography>
                    <Typography variant="h6">Radar</Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
            {narrow ? (
              <>
                <Tooltip title="Homepage">
                  <IconButton onClick={goHome} color={page === 'home' ? 'primary' : 'default'} aria-label="Homepage">
                    <HomeTwoToneIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tracked Repos">
                  <IconButton onClick={goTracked} color={page === 'tracked' ? 'primary' : 'default'} aria-label="Tracked Repos">
                    <BookmarksTwoToneIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="text"
                  size="medium"
                  label="Homepage"
                  startIcon={<HomeTwoToneIcon />}
                  onClick={goHome}
                  sx={(theme) => navButtonSx(theme, page === 'home')}
                />
                <Button
                  variant="text"
                  size="medium"
                  label="Tracked Repos"
                  startIcon={<BookmarksTwoToneIcon />}
                  onClick={goTracked}
                  sx={(theme) => navButtonSx(theme, page === 'tracked')}
                />
              </>
            )}
          </Stack>
        }
        end={
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {/* moved up here from RepoDetailView's own content on a narrow screen - see
                repoRefreshControls above - since the wide layout has room to keep its own copy
                inline beside its tab ButtonGroup instead. */}
            {narrow && repoRefreshControls && <RefreshButton {...repoRefreshControls} />}
            <ColorModeToggle />
          </Stack>
        }
      />
      )}
      {/* position:relative + each transitioning child pinned via inset:0 is what makes this a
          true crossfade rather than a fade-in-only: TransitionGroup keeps the OUTGOING keyed
          child mounted (playing its own exit) for the same `timeout` while the INCOMING one
          mounts and plays its enter, so both are on screen briefly - inset:0 stacks them exactly
          on top of each other instead of the second one just appearing below/after the first in
          normal flex flow. */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <TransitionGroup component={null}>
          {/* keyed by `page`, not the raw pathname - switching WHICH repo the detail page shows
              (via its own side panel, a `replace` navigation - see selectRepo) changes
              location.pathname without changing `page` (still 'repoDetail'), and that switch
              should feel instant, not retrigger this whole-page crossfade every time. The
              `location` passed to Routes is still the raw one, for correct route matching -
              only this Fade's key is normalized.
              Separately: `location` is captured as part of THIS render's element tree - once
              `page` changes and this Fade's key falls out of TransitionGroup's current children,
              TransitionGroup keeps rendering ITS OWN cached copy of this exact element (frozen
              route + all) for the exit animation, rather than asking App to re-render it - so the
              outgoing page keeps showing its own content while fading out, it doesn't jump to the
              new route early. */}
          <Fade key={page} timeout={225}>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <Homepage
                      search={search}
                      trackedKeys={trackedKeys}
                      onToggleTrack={toggleTrack}
                      onSelectRepo={selectRepo}
                    />
                  }
                />
                <Route
                  path="/tracked"
                  element={
                    <TrackedRepos
                      search={searchScope === 'tracked' ? search : ''}
                      trackedRepos={trackedRepos}
                      loading={trackedLoading}
                      error={trackedError}
                      onUntrack={untrack}
                      onSelectRepo={selectRepo}
                    />
                  }
                />
                <Route
                  path="/repos/:owner/:name"
                  element={
                    <RepoDetailPage
                      cachedRepo={selectedRepo}
                      search={search}
                      searchScope={searchScope}
                      trackedRepos={trackedRepos}
                      trackedKeys={trackedKeys}
                      onToggleTrack={toggleTrack}
                      onUntrack={untrack}
                      onClearSearch={() => setSearch('')}
                      searchPanelOpen={searchPanelOpen}
                      onRefreshControlsChange={handleRefreshControlsChange}
                    />
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Box>
          </Fade>
        </TransitionGroup>
      </Box>
      {/* the search field's own narrow-screen home - see the top AppBar's `hideSearch` above.
          A plain flex sibling (not position:fixed) so the content Box's flex:1 already leaves
          exactly enough room for it, rather than needing a manually-tracked height reserved via
          padding on the content below. */}
      {narrow && page !== 'other' && (
        <MuiAppBar position="static" color="transparent" elevation={8} sx={{ bgcolor: 'background.paper' }}>
          {/* `dense` + an explicit fixed `px` (rather than Toolbar's own default gutters, which
              step up at the `sm` breakpoint - still reachable within our own wider "narrow" band)
              is what actually makes this sit flush against RepoDetailView's own bottom tab bar
              with no visible gap or margin mismatch between the two - same horizontal inset,
              same compact vertical sizing, on both. */}
          <Toolbar variant="dense" sx={{ px: 2 }}>
            <SearchField
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={handleSearchFocus}
              hints={[]}
              scopePill={searchScopePill}
              onScopePillRemove={handleScopePillRemove}
              sx={{ width: '100%', maxWidth: 'none' }}
            />
          </Toolbar>
        </MuiAppBar>
      )}
    </Box>
  )
}

export default App
