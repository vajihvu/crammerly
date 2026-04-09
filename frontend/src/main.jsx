import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";
import config from "./config/env";

// Automatically reload if a dynamic import (lazy loaded chunk) fails due to a new deployment
window.addEventListener('vite:preloadError', () => {
  const isAutoReloaded = sessionStorage.getItem('vite-preload-error-reloaded');
  if (!isAutoReloaded) {
    sessionStorage.setItem('vite-preload-error-reloaded', 'true');
    window.location.reload();
  } else {
    sessionStorage.removeItem('vite-preload-error-reloaded');
  }
});

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.isProduction ? 0.2 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: config.nodeEnv,
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
