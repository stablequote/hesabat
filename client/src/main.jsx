import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App.jsx';
import { Notifications } from '@mantine/notifications';
import "./i18n.jsx";
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS >
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)