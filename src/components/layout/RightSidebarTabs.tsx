// ... (around line 100)
  // History
  history: { name: string }[];
  // NEW COLOR PROPS
  foregroundColor: string;
  onForegroundColorChange: (color: string) => void;
} // FIX 8, 9, 10

export const RightSidebarTabs: React.FC<RightSidebarTabsProps> = (props) => { // FIX 123, 124
  const { selectedLayer } = props;
// ...