import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LayersPanel from '@/components/editor/LayersPanel';
import HistoryPanel from '@/components/editor/HistoryPanel';
import AssetsPanel from '@/components/editor/AssetsPanel';
import { Layers, History, Image } from 'lucide-react';
import { Layer } from '@/types/editor'; // Import Layer type

// Defining SidebarProps to match the props passed from Index.tsx (Fixes Error 2)
interface SidebarProps {
    hasImage: boolean;
    layers: Layer[];
    toggleLayerVisibility: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onAddTextLayer: () => void;
    onAddDrawingLayer: () => string;
    onApplySelectionAsMask: () => void;
    
    // Layer Action Props
    selectedLayerId: string | null;
    selectedLayerIds: string[];
    hasActiveSelection: boolean;
    onCreateSmartObject: (layerIds: string[]) => void;
    onToggleClippingMask: (id: string) => void;
    
    // Other props (using index signature for brevity, though specific props are passed)
    [key: string]: any;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    // Wrapper functions to map generic actions to specific handlers
    const handleAddLayer = props.onAddDrawingLayer; 
    
    // Wrapper for 'Create Clipping Mask' button
    const handleToggleClippingMask = (id: string) => props.onToggleClippingMask(id);
    
    // Wrapper for 'Convert to Smart Object' button
    const handleCreateSmartObject = (layerIds: string[]) => props.onCreateSmartObject(layerIds);

    return (
        <div className="h-full w-full flex flex-col bg-background border-r">
            <Tabs defaultValue="layers" className="flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-3 h-10 rounded-none border-b bg-transparent p-0">
                    <TabsTrigger value="layers" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-full">
                        <Layers className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-full">
                        <History className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-full">
                        <Image className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>

                <div className="flex-grow overflow-hidden">
                    <TabsContent value="layers" className="h-full m-0">
                        {props.hasImage ? (
                            <LayersPanel
                                layers={props.layers}
                                onToggleVisibility={props.toggleLayerVisibility}
                                onRename={props.onRename}
                                onDelete={props.onDelete} // Pass delete handler
                                onAddTextLayer={props.onAddTextLayer}
                                onAddDrawingLayer={props.onAddDrawingLayer}
                                onApplySelectionAsMask={props.onApplySelectionAsMask}
                                
                                // Pass state
                                selectedLayerId={props.selectedLayerId}
                                selectedLayerIds={props.selectedLayerIds}
                                hasActiveSelection={props.hasActiveSelection}
                                
                                // Pass action handlers
                                onAddLayer={handleAddLayer}
                                onAddLayerMask={props.onApplySelectionAsMask} // Masking uses selection, so this is the correct handler
                                onConvertToSmartObject={handleCreateSmartObject}
                                onCreateClippingMask={handleToggleClippingMask}
                                
                                // Pass other props needed by LayerItem/LayerList (via rest spread in LayersPanel)
                                {...props}
                            />
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No image loaded.
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="history" className="h-full m-0">
                        <HistoryPanel />
                    </TabsContent>
                    <TabsContent value="assets" className="h-full m-0">
                        <AssetsPanel />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default Sidebar;