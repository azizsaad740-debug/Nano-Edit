import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./globals.css";
import { ThemeProvider } from "./components/layout/ThemeProvider";
import { SessionProvider } from "./integrations/supabase/session-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="nanoedit-theme">
    <SessionProvider>
      <App />
    </SessionProvider>
  </ThemeProvider>
);