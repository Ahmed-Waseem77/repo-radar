import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import type { Theme } from '@mui/material'
import { AppBar, Button, ColorModeToggle, LogoIcon } from '@radar-repo/radar-repo-lib'
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone'
import BookmarksTwoToneIcon from '@mui/icons-material/BookmarksTwoTone'
import { useCtrlKFocus } from './hooks/useCtrlKFocus'
import { useEscapeClearSearch } from './hooks/useEscapeClearSearch'
import { useRandomInterval } from './hooks/useRandomInterval'
import { Homepage } from './pages/Homepage'
import { TrackedRepos } from './pages/TrackedRepos'

type Page = 'home' | 'tracked'

const LOGO_ANIMATION_MIN_INTERVAL_MS = 10_000 // 10 seconds
const LOGO_ANIMATION_MAX_INTERVAL_MS = 12 * 10_000 // 2 minutes

// detected once at module load - navigator.platform doesn't change during the app's lifetime.
// useCtrlKFocus already listens for either metaKey or ctrlKey, so Cmd+K already focuses the
// search field on macOS regardless of this - this only fixes the displayed hint text, which
// was always hardcoded to "Ctrl"/"K".
const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const searchShortcutKeys: [string, string] = isMacOS ? ['Cmd', 'K'] : ['Ctrl', 'K']

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
  const [trackedRepoKeys, setTrackedRepoKeys] = useState<Set<string>>(new Set())
  const searchRef = useCtrlKFocus<HTMLInputElement>()

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

  const onTrack = (repoKey: string) => {
    setTrackedRepoKeys((prev) => {
      const next = new Set(prev)
      if (next.has(repoKey)) {
        next.delete(repoKey)
      } else {
        next.add(repoKey)
      }
      return next
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        ref={searchRef}
        searchValue={search}
        shortcutKeys={searchShortcutKeys}
        onSearchChange={(event) => setSearch(event.target.value)}
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
              onClick={() => setPage('home')}
              sx={(theme) => navButtonSx(theme, page === 'home')}
            />
            <Button
              variant="text"
              size="medium"
              label="Tracked Repos"
              startIcon={<BookmarksTwoToneIcon />}
              onClick={() => setPage('tracked')}
              sx={(theme) => navButtonSx(theme, page === 'tracked')}
            />
            <ColorModeToggle />
          </Stack>
        }
      />
      {page === 'home' ? (
        <Homepage search={search} trackedRepoKeys={trackedRepoKeys} onTrack={onTrack} />
      ) : (
        <TrackedRepos trackedRepoKeys={trackedRepoKeys} />
      )}
    </Box>
  )
}

export default App
