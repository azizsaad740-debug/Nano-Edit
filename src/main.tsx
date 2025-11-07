import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { SessionProvider } from "./integrations/supabase/session-provider";
import { TooltipProvider } from "./components/ui/tooltip"; // Assuming path to TooltipProvider

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <TooltipProvider> {/* FIX: Added TooltipProvider */}
      <SessionProvider>
        <App />
      </SessionProvider>
    </TooltipProvider>
  </React.StrictMode>
);