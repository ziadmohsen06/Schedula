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

export default gardenTheme;