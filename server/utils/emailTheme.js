// Server-side counterpart to the client's themeContent.js — just the palette +
// branding bits needed to render an HTML email matching the user's chosen
// in-app theme (garden/ocean/space/minimal).
const EMAIL_THEMES = {
  garden: {
    logoEmoji: '🌿',
    tagline: 'Your Productivity Garden',
    footerTagline: '🌱 Grow every day with Schedula',
    primary: '#69C37D',
    dark: '#3F8F5A',
    pageBg: '#F4FAF3',
    panelBg: '#FCFFFC',
    textSecondary: '#6C7A6D',
    textStrong: '#2E4A34'
  },
  ocean: {
    logoEmoji: '🐠',
    tagline: 'Your Productivity Reef',
    footerTagline: '🐬 Dive deeper every day with Schedula',
    primary: '#2196F3',
    dark: '#1565C0',
    pageBg: '#EAF6FB',
    panelBg: '#FFFFFF',
    textSecondary: '#4A7A94',
    textStrong: '#0D3B54'
  },
  space: {
    logoEmoji: '🚀',
    tagline: 'Your Productivity Galaxy',
    footerTagline: '🌠 Explore further every day with Schedula',
    primary: '#7C4DFF',
    dark: '#5E35B1',
    pageBg: '#F1EEFB',
    panelBg: '#FFFFFF',
    textSecondary: '#6C5B8C',
    textStrong: '#2A1B4D'
  },
  minimal: {
    logoEmoji: '◆',
    tagline: 'Stay Focused',
    footerTagline: '● Improve every day with Schedula',
    primary: '#424242',
    dark: '#212121',
    pageBg: '#FAFAFA',
    panelBg: '#FFFFFF',
    textSecondary: '#757575',
    textStrong: '#212121'
  }
};

const getEmailTheme = (themeName) => EMAIL_THEMES[themeName] || EMAIL_THEMES.garden;

module.exports = { EMAIL_THEMES, getEmailTheme };
