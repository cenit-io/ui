import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

function loadRuntimeConfig() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "/config.js";
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

async function bootstrap() {
  await loadRuntimeConfig();
  createRoot(rootElement).render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(App)
    )
  );
}

bootstrap();
