import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LayersPanel from '@/components/editor/LayersPanel';
import HistoryPanel from '@/components/editor/HistoryPanel';
import AssetsPanel from '@/components/editor/AssetsPanel';
import { Layers, History, Image } from 'lucide-react';

// Assuming props structure based on the error message
interface SidebarProps {
    hasImage: boolean;
    layers: any[]; // Using any[] since the full Layer type is complex
    toggleLayerVisibility: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onAddTextLayer: () => void;
    onAddDrawingLayer: () => string;
    onApplySelectionAsMask: () => void;
    // ... many other props implied by the error
    [key: string]: any;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    // Placeholder functions to satisfy LayersPanelProps (Fixes Error 2)
    const handleAddLayer = () => console.log('Add Layer');
    const handleAddLayerMask = (id: string) => console.log(`Add Mask to ${id}`);
    const handleConvertToSmartObject = (id: string) => console.log(`Convert to Smart Object ${id}`);
    const handleCreateClippingMask = (id: string) => console.log(`Create Clipping Mask ${id}`);

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
                                onDelete={props.onDelete}
                                onAddTextLayer={props.onAddTextLayer}
                                onAddDrawingLayer={props.onAddDrawingLayer}
                                onApplySelectionAsMask={props.onApplySelectionAsMask}
                                // Passing the newly required handlers (Fixes Error 2)
                                onAddLayer={handleAddLayer}
                                onAddLayerMask={handleAddLayerMask}
                                onConvertToSmartObject={handleConvertToSmartObject}
                                onCreateClippingMask={handleCreateClippingMask}
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