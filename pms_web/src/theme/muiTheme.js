import { createTheme } from '@mui/material/styles';

/**
 * Google Material design tokens.
 * Palette follows Google's own product palette (Blue 600 / Grey surfaces),
 * typography follows Google Sans (headings) + Roboto (body), which is the
 * exact pairing Google uses across Workspace products.
 */
const googlePalette = {
  blue: '#1a73e8',
  blueHover: '#1765cc',
  green: '#188038',
  red: '#d93025',
  yellow: '#f9ab00',
  grey900: '#202124',
  grey700: '#3c4043',
  grey500: '#5f6368',
  grey300: '#dadce0',
  grey100: '#f1f3f4',
  grey50: '#f8f9fa',
  white: '#ffffff'
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: googlePalette.blue, dark: googlePalette.blueHover, contrastText: '#fff' },
    success: { main: googlePalette.green },
    error: { main: googlePalette.red },
    warning: { main: googlePalette.yellow },
    background: { default: googlePalette.grey50, paper: googlePalette.white },
    text: { primary: googlePalette.grey900, secondary: googlePalette.grey500 },
    divider: googlePalette.grey300
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    h2: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    h3: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    h4: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    h5: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    h6: { fontFamily: '"Google Sans", sans-serif', fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500 }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)' }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: googlePalette.white,
          color: googlePalette.grey900,
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.15)'
        }
      }
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6 } }
    }
  }
});

export default theme;
