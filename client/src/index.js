import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import RootThemeProvider from './components/RootThemeProvider';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </RootThemeProvider>
  </React.StrictMode>
);

reportWebVitals();