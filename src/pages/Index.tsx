import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
// ... (other imports)
import { SaveGradientPresetDialog } from "@/components/editor/SaveGradientPresetDialog";
import { showLoading, dismissToast, showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import type { TemplateData } from "../types/template"; // FIXED: Relative path

const Index = () => {
// ... (rest of the file remains the same)