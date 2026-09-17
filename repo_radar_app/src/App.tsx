import { useState } from 'react'
import { Box, Container, Stack, Typography } from '@mui/material'
import { Button } from '@radar-repo/radar-repo-lib'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container maxWidth="sm">
      <Stack
        spacing={3}
        sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100svh', textAlign: 'center' }}
      >
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
