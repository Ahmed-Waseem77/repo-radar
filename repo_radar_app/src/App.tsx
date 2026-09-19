import { useState } from 'react'
import { Box, Container, Divider, Stack, Typography } from '@mui/material'
import { AppBar, Button, ColorModeToggle, LogoIcon, NoSearchIcon, RepoOverviewTablePagination } from '@radar-repo/radar-repo-lib'
import { useCtrlKFocus } from './hooks/useCtrlKFocus'

function App() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const searchRef = useCtrlKFocus<HTMLInputElement>()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        ref={searchRef}
        searchValue={search}
        onSearchChange={(event) => setSearch(event.target.value)}
        start={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <LogoIcon />
            <Typography variant="h6">Repo Radar</Typography>
          </Stack>
        }
        end={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              variant="text"
              size="medium"
              label="Tracked Repos"
              sx={(theme) => ({
                color: 'text.primary',
                fontWeight: 700,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  bottom: 6,
                  width: 0,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: 'text.primary',
                  transform: 'translateX(-50%)',
                  transition: theme.transitions.create('width'),
                },
                '&:hover::after, &:focus-visible::after': {
                  width: '70%',
                },
              })}
            />
            <ColorModeToggle />
          </Stack>
        }
      />
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Container maxWidth="md" sx={{ py: 2 }}>
            <RepoOverviewTablePagination
              repos={[]}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(0)
              }}
              emptyStateImage={<NoSearchIcon sx={{ width: 200, height: 'auto' }} />}
              emptyStateLabel="start searching for repos to track"
            />
          </Container>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {/* TODO: next section */}
        </Box>
      </Box>
    </Box>
  )
}

export default App
