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
  // Pill's neutral 'default' variant has no semantic color (primary/warning/etc.) to draw its
  // outline/text color from, so it gets its own deliberately-chosen, theme-aware value here
  // instead of approximating one from `action`/`text` tokens meant for other purposes.
  interface Palette {
    pillDefault: { text: string }
  }
  interface PaletteOptions {
    pillDefault?: { text: string }
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
      styleOverrides: (theme) => ({
        'code, kbd, pre, samp': {
          fontFamily: '"Iosevka", ui-monospace, "SFMono-Regular", Consolas, monospace',
        },
        // theme-aware scrollbar, applied globally (not just html/body) so every scrollable
        // container in the app picks it up, not only the page's own outer scroll. Firefox uses
        // scrollbar-color/scrollbar-width; everything else uses the -webkit-scrollbar
        // pseudo-elements. theme.vars.palette.X (falling back to theme.palette.X) is used
        // explicitly since these are raw CSS values, not sx keys MUI auto-resolves palette
        // path shorthands for.
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.vars?.palette.divider ?? theme.palette.divider} transparent`,
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: theme.vars?.palette.divider ?? theme.palette.divider,
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme.vars?.palette.text.secondary ?? theme.palette.text.secondary,
        },
      }),
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
        pillDefault: {
          text: '#0C100C',
        },
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
        pillDefault: {
          text: '#EAEDEA',
        },
      },
    },
  },
})
