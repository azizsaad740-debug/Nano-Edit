import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCommunityTemplates } from "@/utils/templateApi";
import type { CommunityTemplate } from "../types/template"; // FIXED: Relative path
import { TemplateCard } from "../components/community/TemplateCard"; // FIXED: Relative path
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Community = () => {
// ... (rest of the file remains the same)