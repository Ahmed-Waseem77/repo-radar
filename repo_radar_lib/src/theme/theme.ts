import { createTheme } from '@mui/material/styles'

// The theme uses `cssVariables: true` below, but MUI only types theme.colorSchemes,
// theme.vars, etc. when this module augmentation opts in - otherwise those members
// exist at runtime but TypeScript doesn't know about them.
declare module '@mui/material/styles' {
  interface CssThemeVariables {
    enabled: true
  }
  // custom `text.dimmed` palette entry - MUI's Typography auto-generates a `color="textDimmed"`
  // variant for any string key under theme.palette.text, but TypeText itself is a closed
  // interface, so without this the literal below fails an excess-property check.
  interface TypeText {
    dimmed: string
  }
}

const headingFontFamily = '"Staatliches", "Roboto Condensed", "Helvetica", "Arial", sans-serif'

const semanticPalette = {
  primary: {
    dark: '#3E5B29',
    main: '#5B8B31',
    light: '#72A346',
  },
  secondary: {
    dark: '#7C3212',
    main: '#B34110',
    light: '#D95310',
  },
  error: {
    dark: '#7C2B30',
    main: '#B33847',
    light: '#DD3D50',
  },
  warning: {
    dark: '#55501D',
    main: '#B3B338',
    light: '#DDDD3D',
  },
  info: {
    dark: '#1D4E55',
    main: '#109DB3',
    light: '#10C5D9',
  },
  success: {
    dark: '#1E551D',
    main: '#3CB43C',
    light: '#39DB39',
  },
}

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  typography: {
    fontFamily: '"Roboto Condensed", "Helvetica", "Arial", sans-serif',
    fontWeightRegular: 400,
    h1: { fontFamily: headingFontFamily },
    h2: { fontFamily: headingFontFamily },
    h3: { fontFamily: headingFontFamily },
    h4: { fontFamily: headingFontFamily },
    h5: { fontFamily: headingFontFamily },
    h6: { fontFamily: headingFontFamily },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'code, kbd, pre, samp': {
          fontFamily: '"Iosevka", ui-monospace, "SFMono-Regular", Consolas, monospace',
        },
      },
    },
  },
  colorSchemes: {
    light: {
      palette: {
        ...semanticPalette,
        background: {
          default: '#EAEDEA',
          paper: '#DFE6DF',
        },
        text: {
          primary: '#0C100C',
          secondary: '#3C473A',
          dimmed: '#B3C4B3',
        },
        divider: '#CCDACC',
      },
    },
    dark: {
      palette: {
        ...semanticPalette,
        background: {
          default: '#0C100C',
          paper: '#161C15',
        },
        text: {
          primary: '#EAEDEA',
          secondary: '#CCDACC',
          dimmed: '#293427',
        },
        divider: '#293427',
      },
    },
  },
})
