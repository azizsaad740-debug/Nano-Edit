import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "./pages/Index"; // FIXED: Ensure named export is used
import NotFound from "./pages/NotFound";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/community" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};