import { createTheme } from '@mui/material/styles';

export const gardenTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#F4FAF3',
      paper: '#FCFFFC',
    },
    primary: {
      main: '#69C37D',
      dark: '#3F8F5A',
    },
    secondary: {
      main: '#F6C453',
    },
    text: {
      primary: '#2E4634',
      secondary: '#6C7A6D',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.5s ease, color 0.5s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 4px 12px rgba(105, 195, 125, 0.3)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
            boxShadow: '0 2px 4px rgba(105, 195, 125, 0.2) !important',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 6px 16px rgba(105, 195, 125, 0.4)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
          },
        },
        outlined: {
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 4px 8px rgba(105, 195, 125, 0.2)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
          },
        },
        text: {
          '&:hover': {
            transform: 'translateY(-1px) scale(1.03)',
            boxShadow: 'none',
          },
          '&:active': {
            transform: 'scale(0.95) !important',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.1)',
            backgroundColor: 'rgba(105, 195, 125, 0.1)',
          },
          '&:active': {
            transform: 'scale(0.85) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateX(4px)',
          },
          '&:active': {
            transform: 'scale(0.97) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
          },
        },
      },
    },
  },
});

export const darkGardenTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f1f12',
      paper: '#162418',
    },
    primary: {
      main: '#69C37D',
      dark: '#3F8F5A',
    },
    secondary: {
      main: '#F6C453',
    },
    text: {
      primary: '#d4edda',
      secondary: '#8fac93',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.5s ease, color 0.5s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 4px 12px rgba(105, 195, 125, 0.2)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
            boxShadow: '0 2px 4px rgba(105, 195, 125, 0.15) !important',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 6px 16px rgba(105, 195, 125, 0.3)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
          },
        },
        outlined: {
          '&:hover': {
            transform: 'translateY(-2px) scale(1.05)',
            boxShadow: '0 4px 8px rgba(105, 195, 125, 0.15)',
          },
          '&:active': {
            transform: 'scale(0.92) !important',
          },
        },
        text: {
          '&:hover': {
            transform: 'translateY(-1px) scale(1.03)',
            boxShadow: 'none',
          },
          '&:active': {
            transform: 'scale(0.95) !important',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.1)',
            backgroundColor: 'rgba(105, 195, 125, 0.08)',
          },
          '&:active': {
            transform: 'scale(0.85) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease !important',
          '&:hover': {
            transform: 'translateX(4px)',
          },
          '&:active': {
            transform: 'scale(0.97) !important',
            transition: 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) !important',
          },
        },
      },
    },
  },
});

export const oceanTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#EAF6FB', paper: '#FFFFFF' },
    primary: { main: '#2196F3', dark: '#1565C0' },
    secondary: { main: '#26C6DA' },
    text: { primary: '#0D3B54', secondary: '#4A7A94' },
  },
});

export const darkOceanTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#071824', paper: '#0F2A3A' },
    primary: { main: '#42A5F5', dark: '#1E88E5' },
    secondary: { main: '#26C6DA' },
    text: { primary: '#DCEEFA', secondary: '#8FB8CC' },
  },
});

export const spaceTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#F1EEFB', paper: '#FFFFFF' },
    primary: { main: '#7C4DFF', dark: '#5E35B1' },
    secondary: { main: '#FF4081' },
    text: { primary: '#2A1B4D', secondary: '#6C5B8C' },
  },
});

export const darkSpaceTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0A0518', paper: '#150E2B' },
    primary: { main: '#B388FF', dark: '#7C4DFF' },
    secondary: { main: '#FF4081' },
    text: { primary: '#E5DEFF', secondary: '#A99BCB' },
  },
});

export const minimalTheme = createTheme({
  palette: {
    mode: 'light',
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    primary: { main: '#212121', dark: '#000000' },
    secondary: { main: '#757575' },
    text: { primary: '#212121', secondary: '#757575' },
  },
});

export const darkMinimalTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#121212', paper: '#1E1E1E' },
    primary: { main: '#E0E0E0', dark: '#BDBDBD' },
    secondary: { main: '#9E9E9E' },
    text: { primary: '#F5F5F5', secondary: '#B0B0B0' },
  },
});

export const THEME_REGISTRY = {
  garden: { label: '🌿 Garden', light: gardenTheme, dark: darkGardenTheme, swatch: '#69C37D' },
  ocean: { label: '🌊 Ocean', light: oceanTheme, dark: darkOceanTheme, swatch: '#2196F3' },
  space: { label: '🌌 Space', light: spaceTheme, dark: darkSpaceTheme, swatch: '#7C4DFF' },
  minimal: { label: '⚪ Minimal', light: minimalTheme, dark: darkMinimalTheme, swatch: '#424242' },
};

export default gardenTheme;