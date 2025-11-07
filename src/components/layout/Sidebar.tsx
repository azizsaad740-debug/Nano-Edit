import React from 'react';
import { useEditorContext } from '@/context/EditorContext'; // FIX 23: Context stubbed
import { RightSidebarTabs, RightSidebarTabsProps } from "./RightSidebarTabs";
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea is used

// Assuming Sidebar component structure
const Sidebar: React.FC = () => {
    const editorLogic = useEditorContext();
    
    // Destructure clearSelectionState and pass the rest of the props
    const { clearSelectionState, ...restOfProps } = editorLogic; 

    return (
        <div className="w-72 border-l bg-background/90 flex flex-col">
            <ScrollArea className="h-full">
                {/* FIX 24: Passing required prop clearSelectionState */}
                <RightSidebarTabs {...restOfProps} clearSelectionState={clearSelectionState} /> 
            </ScrollArea>
        </div>
    );
};
export default Sidebar;