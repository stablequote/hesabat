import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App.jsx';
import { Notifications } from '@mantine/notifications';
import "./i18n.jsx";
import './index.css';
// mantine v7 styles imports
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider withGlobalStyles withNormalizeCSS >
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
)