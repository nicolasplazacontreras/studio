"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { type ClothingItem, type CanvasItem } from '@/lib/types';
import { Button } from './ui/button';
import { Download, Save, Trash2, X, Sparkles, HardDriveDownload, Scissors, Undo, ImageIcon, Wand2, RefreshCw, Replace, Loader2, Ellipsis, SendToBack, Undo2, Layers, Crop } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { removeBackground } from '@/ai/flows/remove-background';
import { createCutout } from '@/ai/flows/create-cutout';
import { refineMask } from '@/ai/flows/refine-mask';
import { toJpeg } from 'html-to-image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Rnd } from 'react-rnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { LayersPanel } from './layers-panel';

interface OutfitCanvasProps {
  items: CanvasItem[];
  setItems: (items: CanvasItem[]) => void;
  onSaveClick: () => void;
  onItemUpdate: (item: ClothingItem) => void;
}

const checkIntersection = (rect1: DOMRect, rect2: DOMRect) => {
  return !(rect2.left > rect1.right || 
           rect2.right < rect1.left || 
           rect2.top > rect1.bottom || 
           rect2.bottom < rect1.top);
};

export default function OutfitCanvas({ items, setItems, onSaveClick, onItemUpdate }: OutfitCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{[key: string]: HTMLDivElement}>({});

  const [isExporting, setIsExporting] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  
  const [refiningItemInstanceId, setRefiningItemInstanceId] = useState<string | null>(null);
  const [isProcessingMask, setIsProcessingMask] = useState<false | 'invert' | 'regenerate' | 'eliminate'>(false);

  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number, startX: number, startY: number } | null>(null);

  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [keepLayersOrder, setKeepLayersOrder] = useState(false);

  const [isSelectingForExport, setIsSelectingForExport] = useState(false);
  const [exportSelectionBox, setExportSelectionBox] = useState({ width: 400, height: 400, x: 100, y: 100 });

  const refiningItem = items.find(item => item.instanceId === refiningItemInstanceId);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;
    
    const item: ClothingItem = JSON.parse(itemData);
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    const maxZIndex = Math.max(0, ...items.map(i => i.zIndex || 0));
    const newCanvasItem: CanvasItem = {
      instanceId: `${item.id}-${Date.now()}`,
      item,
      x: x - 100, // Center the drop on cursor
      y: y - 100,
      width: 200,
      height: 200,
      zIndex: maxZIndex + 1,
    };
    setItems([...items, newCanvasItem]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleExportFullCanvas = async () => {
    if (!canvasRef.current) return;
    if (items.length === 0) {
        toast({ variant: "destructive", title: "Canvas is empty" });
        return;
    }
    setIsExporting(true);
    toast({ title: "Preparing your image..." });
    try {
        const dataUrl = await toJpeg(canvasRef.current, { quality: 0.95, style: { background: 'white' } });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `wrdrobe-outfit-canvas-${Date.now()}.jpg`;
        link.click();
    } catch (error) {
        toast({ variant: "destructive", title: "Export Failed" });
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportSelection = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    toast({ title: "Exporting selection..." });

    try {
        const fullCanvasDataUrl = await toJpeg(canvasRef.current, { 
            quality: 1, 
            style: { background: 'white' },
            filter: (node) => {
                // Exclude the selection UI from the final image
                if (node.classList && typeof node.classList.contains === 'function') {
                    return !node.classList.contains('export-selection-ui');
                }
                return true;
            }
         });
        
        const image = new window.Image();
        image.src = fullCanvasDataUrl;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = exportSelectionBox.width;
            canvas.height = exportSelectionBox.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                 toast({ variant: "destructive", title: "Export Failed", description: "Could not create image context." });
                 setIsExporting(false);
                 setIsSelectingForExport(false);
                 return;
            }
            
            ctx.drawImage(
                image,
                exportSelectionBox.x,
                exportSelectionBox.y,
                exportSelectionBox.width,
                exportSelectionBox.height,
                0,
                0,
                exportSelectionBox.width,
                exportSelectionBox.height
            );
            
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            const link = document.createElement('a');
            link.href = croppedDataUrl;
            link.download = `wrdrobe-selection-${Date.now()}.jpg`;
            link.click();

            toast({ title: "Export successful!" });
            setIsSelectingForExport(false);
        }
        image.onerror = () => {
            toast({ variant: "destructive", title: "Export Failed", description: "Could not load image for cropping." });
            setIsSelectingForExport(false);
        }

    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Export Failed" });
    } finally {
        setIsExporting(false);
    }
  };
  
  const handleRevert = (canvasItem: CanvasItem) => {
    if (canvasItem.item.originalPhotoDataUri) {
        const updatedItem: ClothingItem = {
            ...canvasItem.item,
            photoDataUri: canvasItem.item.originalPhotoDataUri,
            originalPhotoDataUri: undefined,
            maskDataUri: undefined,
            lastAiAction: undefined,
        };
        onItemUpdate(updatedItem);
        toast({ title: "Reverted to Original" });
    }
  };

  const handleSendToBack = (instanceId: string) => {
    if (items.length < 2) return;
    
    const minZIndex = Math.min(...items.filter(i => i.instanceId !== instanceId).map(i => i.zIndex || 0));
    setItems(items.map(item => 
        item.instanceId === instanceId 
            ? { ...item, zIndex: minZIndex - 1 } 
            : item
    ));
  };
  
  const handleAiAction = async (canvasItem: CanvasItem, action: 'cutout' | 'remove') => {
    if (processingItemId) return;

    setProcessingItemId(canvasItem.instanceId);
    
    const actionText = action === 'cutout' ? 'cutout' : 'background removal';
    toast({ title: `Creating ${actionText}...`, description: "The AI is working its magic. This may take a moment." });

    try {
        const flow = action === 'cutout' ? createCutout : removeBackground;
        const result = await flow({ photoDataUri: canvasItem.item.originalPhotoDataUri || canvasItem.item.photoDataUri });
        
        const updatedItem: ClothingItem = {
            ...canvasItem.item,
            photoDataUri: canvasItem.item.originalPhotoDataUri || canvasItem.item.photoDataUri,
            maskDataUri: result.maskDataUri, 
            originalPhotoDataUri: canvasItem.item.originalPhotoDataUri || canvasItem.item.photoDataUri,
            lastAiAction: action,
        };

        onItemUpdate(updatedItem);
        toast({ title: `${action === 'cutout' ? 'Cutout created' : 'Background removed'} successfully!` });
    } catch (error) {
        console.error(`${actionText} failed:`, error);
        toast({ variant: "destructive", title: `${actionText} failed`, description: "The AI couldn't process this image. Please try another." });
    } finally {
        setProcessingItemId(null);
    }
  };

  const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current || isSelectingForExport) return;
    e.preventDefault();
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - canvasRect.left;
    const startY = e.clientY - canvasRect.top;

    setIsSelecting(true);
    setSelectionBox({ x: startX, y: startY, width: 0, height: 0, startX, startY });
    setSelectedInstanceIds([]);
  };

  const handleMouseMoveOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isSelecting || !selectionBox) return;
      e.preventDefault();

      const canvasRect = canvasRef.current!.getBoundingClientRect();
      const currentX = e.clientX - canvasRect.left;
      const currentY = e.clientY - canvasRect.top;
      
      const newWidth = currentX - selectionBox.startX;
      const newHeight = currentY - selectionBox.startY;

      setSelectionBox({
          ...selectionBox,
          x: newWidth > 0 ? selectionBox.startX : currentX,
          y: newHeight > 0 ? selectionBox.startY : currentY,
          width: Math.abs(newWidth),
          height: Math.abs(newHeight),
      });
  };

  const handleMouseUpOnCanvas = () => {
      if (isSelecting && selectionBox && canvasRef.current) {
          const selectionRect = {
              left: selectionBox.x,
              top: selectionBox.y,
              right: selectionBox.x + selectionBox.width,
              bottom: selectionBox.y + selectionBox.height,
              width: selectionBox.width,
              height: selectionBox.height
          } as DOMRect;
          
          const newSelectedIds = items.filter(item => {
              const itemDiv = itemRefs.current[item.instanceId];
              if (!itemDiv) return false;
              const itemRect = itemDiv.getBoundingClientRect();
              const canvasRect = canvasRef.current!.getBoundingClientRect();
              
              const relativeItemRect = {
                left: itemRect.left - canvasRect.left,
                top: itemRect.top - canvasRect.top,
                right: itemRect.right - canvasRect.left,
                bottom: itemRect.bottom - canvasRect.top,
              } as DOMRect;

              return checkIntersection(selectionRect, relativeItemRect);
          }).map(item => item.instanceId);

          setSelectedInstanceIds(newSelectedIds);
      }
      setIsSelecting(false);
      setSelectionBox(null);
  };
  
  const handleItemMouseDown = (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation();
    const isSelected = selectedInstanceIds.includes(instanceId);
    if (e.shiftKey) {
        setSelectedInstanceIds(prev => isSelected ? prev.filter(id => id !== instanceId) : [...prev, instanceId]);
    } else if (!isSelected) {
        setSelectedInstanceIds([instanceId]);
    }

    if (!keepLayersOrder) {
      const maxZIndex = Math.max(0, ...items.map(i => i.zIndex || 0));
      setItems(items.map(item => item.instanceId === instanceId ? { ...item, zIndex: maxZIndex + 1 } : item));
    }
  };
  
    const invertImage = (dataUri: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];     // red
                    data[i + 1] = 255 - data[i + 1]; // green
                    data[i + 2] = 255 - data[i + 2]; // blue
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL());
            };
            img.onerror = reject;
            img.src = dataUri;
        });
    };

    const handleInvertMask = async () => {
        if (!refiningItem || !refiningItem.item.maskDataUri) return;
        
        setIsProcessingMask('invert');
        try {
            const invertedMaskUri = await invertImage(refiningItem.item.maskDataUri);
            const updatedItem: ClothingItem = {
                ...refiningItem.item,
                maskDataUri: invertedMaskUri,
            };
            onItemUpdate(updatedItem);
            toast({ title: "Mask Inverted" });
        } catch (error) {
            console.error("Failed to invert mask:", error);
            toast({ variant: 'destructive', title: 'Invert Failed' });
        } finally {
            setIsProcessingMask(false);
        }
    };

    const handleRegenerateMask = async () => {
        if (!refiningItem || !refiningItem.item.lastAiAction) return;
        setIsProcessingMask('regenerate');
        await handleAiAction(refiningItem, refiningItem.item.lastAiAction);
        setIsProcessingMask(false);
    };

    const handleEliminateDetail = async () => {
        if (!refiningItem || !refiningItem.item.maskDataUri) return;

        setIsProcessingMask('eliminate');
        toast({ title: "Eliminating details...", description: "This might take a moment." });

        try {
            const result = await refineMask({ maskDataUri: refiningItem.item.maskDataUri });
            const updatedItem: ClothingItem = {
                ...refiningItem.item,
                maskDataUri: result.refinedMaskDataUri,
            };
            onItemUpdate(updatedItem);
            toast({ title: "Details eliminated!" });
        } catch (error) {
            console.error("Failed to eliminate detail:", error);
            toast({ variant: 'destructive', title: 'Refinement Failed', description: 'Could not process the mask.' });
        } finally {
            setIsProcessingMask(false);
        }
    };

    const handleRemoveMask = () => {
        if (!refiningItem) return;
        const updatedItem: ClothingItem = {
            ...refiningItem.item,
            maskDataUri: undefined,
            lastAiAction: undefined,
            originalPhotoDataUri: undefined,
        };
        onItemUpdate(updatedItem);
        setRefiningItemInstanceId(null);
        toast({ title: "Mask Removed" });
    };

  return (
    <div className="flex flex-1 flex-col bg-muted/30 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Outfit Canvas</h2>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={onSaveClick}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isSelectingForExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportFullCanvas} disabled={isExporting}>
                    <HardDriveDownload className="mr-2 h-4 w-4" />
                    Export full canvas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSelectingForExport(true)} disabled={isExporting}>
                    <Crop className="mr-2 h-4 w-4" />
                    Export selection
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="destructive" size="sm" onClick={() => setItems([])} disabled={isSelectingForExport}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
       <Dialog open={!!refiningItem} onOpenChange={(isOpen) => !isOpen && setRefiningItemInstanceId(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Refine Mask</DialogTitle>
                  <DialogDescription>
                    You can regenerate the mask, invert its colors, or eliminate details if the mask isn't perfect.
                  </DialogDescription>
              </DialogHeader>
              {refiningItem?.item.maskDataUri && <Image src={refiningItem.item.maskDataUri} alt="Mask preview" width={512} height={512} className="rounded-md mx-auto bg-gray-200" />}
              <DialogFooter className="gap-2 flex-wrap sm:justify-end">
                  <Button variant="outline" onClick={() => setRefiningItemInstanceId(null)} disabled={!!isProcessingMask}>Close</Button>
                  <Button onClick={handleEliminateDetail} disabled={!!isProcessingMask}>
                      {isProcessingMask === 'eliminate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                      Eliminate Detail
                  </Button>
                  <Button onClick={handleInvertMask} disabled={!!isProcessingMask}>
                      {isProcessingMask === 'invert' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />}
                      Invert Colors
                  </Button>
                  <Button onClick={handleRegenerateMask} disabled={!!isProcessingMask}>
                      {isProcessingMask === 'regenerate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Regenerate
                  </Button>
                   <Button onClick={handleRemoveMask} disabled={!!isProcessingMask} variant="destructive">
                        <Undo2 className="mr-2 h-4 w-4" />
                        Start Again
                    </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <LayersPanel
        isOpen={isLayersPanelOpen}
        onOpenChange={setIsLayersPanelOpen}
        items={items}
        setItems={setItems}
        keepLayersOrder={keepLayersOrder}
        onKeepLayersOrderChange={setKeepLayersOrder}
      />
      <div 
        ref={canvasRef}
        className={`flex-1 relative bg-background rounded-lg border overflow-hidden transition-colors ${isOver ? 'bg-accent' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseDown={handleMouseDownOnCanvas}
        onMouseMove={handleMouseMoveOnCanvas}
        onMouseUp={handleMouseUpOnCanvas}
      >
        {items.length >= 2 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsLayersPanelOpen(true)}
                    className="absolute top-2 right-2 z-10 h-8 w-8"
                  >
                    <Layers className="h-4 w-4" />
                    <span className="sr-only">Edit Layers</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Layers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        {selectionBox && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/20 pointer-events-none"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
        {isSelectingForExport && (
            <div className="absolute inset-0 z-20 export-selection-ui">
                <div className="absolute inset-0 bg-black/70" />
                <Rnd
                    style={{ border: '2px dashed white' }}
                    bounds="parent"
                    size={{ width: exportSelectionBox.width, height: exportSelectionBox.height }}
                    position={{ x: exportSelectionBox.x, y: exportSelectionBox.y }}
                    onDragStop={(e, d) => setExportSelectionBox(prev => ({ ...prev, x: d.x, y: d.y }))}
                    onResizeStop={(e, direction, ref, delta, position) => {
                        setExportSelectionBox({
                            width: ref.offsetWidth,
                            height: ref.offsetHeight,
                            ...position,
                        });
                    }}
                />
                <div className="absolute bottom-4 right-4 z-30 flex gap-2">
                    <Button variant="secondary" onClick={() => setIsSelectingForExport(false)} disabled={isExporting}>Cancel</Button>
                    <Button onClick={handleExportSelection} disabled={isExporting}>
                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
                        {isExporting ? 'Exporting...' : 'Export Selection'}
                    </Button>
                </div>
            </div>
        )}
        {items.map(canvasItem => {
            const hasAlteredImage = !!canvasItem.item.originalPhotoDataUri;
            const imageStyle: React.CSSProperties = { objectFit: 'cover' };
            if (canvasItem.item.maskDataUri) {
                const style = imageStyle as any;
                style.maskImage = `url(${canvasItem.item.maskDataUri})`;
                style.WebkitMaskImage = `url(${canvasItem.item.maskDataUri})`;
                style.maskMode = 'luminance';
                style.WebkitMaskMode = 'luminance';
                style.maskSize = 'cover';
                style.WebkitMaskSize = 'cover';
                style.maskRepeat = 'no-repeat';
                style.WebkitMaskRepeat = 'no-repeat';
                style.maskPosition = 'center';
                style.WebkitMaskPosition = 'center';
            }

            return (
            <Rnd
                key={canvasItem.instanceId}
                size={{ width: canvasItem.width, height: canvasItem.height }}
                position={{ x: canvasItem.x, y: canvasItem.y }}
                style={{ zIndex: canvasItem.zIndex }}
                minWidth={50}
                minHeight={50}
                onMouseDown={(e) => handleItemMouseDown(e, canvasItem.instanceId)}
                onDrag={(e, data) => {
                    const { deltaX, deltaY } = data;
                    setItems(currentItems => currentItems.map(item => 
                        selectedInstanceIds.includes(item.instanceId)
                            ? { ...item, x: item.x + deltaX, y: item.y + deltaY }
                            : item
                    ));
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                    setItems(items.map(i => i.instanceId === canvasItem.instanceId ? {
                        ...i,
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        ...position,
                    } : i));
                }}
                bounds="parent"
                className="group"
                disableDragging={isSelectingForExport}
                enableResizing={!isSelectingForExport}
            >
                <div 
                  className={`w-full h-full relative border-2 rounded-md transition-colors ${selectedInstanceIds.includes(canvasItem.instanceId) ? 'border-primary' : 'border-transparent group-hover:border-primary group-hover:border-dashed'}`}
                  ref={el => { if(el) itemRefs.current[canvasItem.instanceId] = el}}
                >
                    <Image
                        src={canvasItem.item.photoDataUri}
                        alt={canvasItem.item.name}
                        fill
                        className="pointer-events-none rounded-md"
                        style={imageStyle}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute -top-3 -left-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                                disabled={!!processingItemId}
                                onClick={e => e.stopPropagation()}
                            >
                                {processingItemId === canvasItem.instanceId ? <Sparkles className="h-4 w-4 animate-spin" /> : <Ellipsis className="h-4 w-4" />}
                                <span className="sr-only">Item Options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={e => e.stopPropagation()} side="right" align="start">
                            <DropdownMenuItem onSelect={() => handleAiAction(canvasItem, 'cutout')}>
                                <Scissors className="mr-2 h-4 w-4" />
                                <span>Magazine Cutout</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAiAction(canvasItem, 'remove')}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                <span>Remove Background</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleSendToBack(canvasItem.instanceId)}>
                                <SendToBack className="mr-2 h-4 w-4" />
                                <span>Send to Back</span>
                            </DropdownMenuItem>
                            {hasAlteredImage && (
                                <>
                                    <DropdownMenuItem onSelect={() => handleRevert(canvasItem)}>
                                        <Undo className="mr-2 h-4 w-4" />
                                        <span>Revert to Original</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {canvasItem.item.maskDataUri && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="absolute -bottom-3 -left-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRefiningItemInstanceId(canvasItem.instanceId);
                                        }}
                                    >
                                        <Scissors className="h-4 w-4" />
                                        <span className="sr-only">Refine Mask</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Refine Mask</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            setItems(items.filter(i => i.instanceId !== canvasItem.instanceId));
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    {processingItemId === canvasItem.instanceId && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md pointer-events-none">
                            <Sparkles className="h-8 w-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
            </Rnd>
        )})}
         {items.length === 0 && !isOver && !isSelectingForExport && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-lg">Drop clothing items here to start building your outfit!</p>
            </div>
        )}
      </div>
    </div>
  );
}
