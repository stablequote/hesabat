
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MantineProvider,
  DirectionProvider,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import App from "./App.jsx";
import "./i18n.jsx";
import "./index.css";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DirectionProvider initialDirection="ltr">
      <MantineProvider>
        <Notifications />
        <App />
      </MantineProvider>
    </DirectionProvider>
  </StrictMode>
);