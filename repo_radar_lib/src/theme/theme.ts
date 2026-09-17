import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'media',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#9c27b0',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#9c27b0',
        },
      },
    },
  },
})
