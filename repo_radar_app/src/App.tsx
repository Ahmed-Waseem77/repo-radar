import { useState } from 'react'
import { Box, Container, MenuItem, Select, Stack, Typography } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'
import { Button } from '@radar-repo/radar-repo-lib'

function App() {
  const [count, setCount] = useState(0)
  const { mode, setMode } = useColorScheme()

  const handleModeChange = (event: SelectChangeEvent) => {
    setMode(event.target.value as 'light' | 'dark' | 'system')
  }

  return (
    <Container maxWidth="sm">
      <Stack
        spacing={3}
        sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100svh', textAlign: 'center' }}
      >
        <Select
          value={mode ?? 'system'}
          onChange={handleModeChange}
          size="small"
          sx={{ alignSelf: 'flex-end' }}
        >
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </Select>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Repo Radar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Edit <code>src/App.tsx</code> to get started.
          </Typography>
        </Box>
        <Button
          label={`Count is ${count}`}
          variant="contained"
          onClick={() => setCount((count) => count + 1)}
        />
      </Stack>
    </Container>
  )
}

export default App
