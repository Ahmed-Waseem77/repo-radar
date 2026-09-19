import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from '../src/theme/theme'
import '@fontsource/roboto-condensed/400.css'
import '@fontsource/staatliches/400.css'
import '@fontsource/iosevka/400.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default preview
