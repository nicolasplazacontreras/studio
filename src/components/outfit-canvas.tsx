"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { type ClothingItem, type CanvasItem } from '@/lib/types';
import { Button } from './ui/button';
import { Download, Save, Trash2, X, Sparkles, HardDriveDownload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';
import { toJpeg } from 'html-to-image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Rnd } from 'react-rnd';

interface OutfitCanvasProps {
  items: CanvasItem[];
  setItems: (items: CanvasItem[]) => void;
  onSave: () => void;
}

const checkIntersection = (rect1: DOMRect, rect2: DOMRect) => {
  return !(rect2.left > rect1.right || 
           rect2.right < rect1.left || 
           rect2.top > rect1.bottom || 
           rect2.bottom < rect1.top);
};

export default function OutfitCanvas({ items, setItems, onSave }: OutfitCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{[key: string]: HTMLDivElement}>({});

  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isOver, setIsOver] = useState(false);

  // New state for multi-select
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number, startX: number, startY: number } | null>(null);

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

  const handleSimpleDownload = async () => {
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

  const handleDownload = async () => {
    if (items.length === 0) {
        toast({ variant: "destructive", title: "Canvas is empty" });
        return;
    }
    setIsDownloading(true);
    toast({ title: "Generating your outfit image..." });
    try {
        const result = await generateOutfitImage({
            items: items.map(canvasItem => ({
                photoDataUri: canvasItem.item.photoDataUri,
                category: canvasItem.item.category,
            })),
            aspectRatio: aspectRatio,
        });
        const link = document.createElement('a');
        link.href = result.photoDataUri;
        link.download = `wrdrobe-outfit-${Date.now()}.png`;
        link.click();
        setIsDownloadDialogOpen(false);
        toast({ title: "Download started!" });
    } catch (error) {
        toast({ variant: "destructive", title: "Download Failed" });
    } finally {
        setIsDownloading(false);
    }
  };

  const handleMouseDownOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current) return;
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

      const canvasRect = canvasRef.current.getBoundingClientRect();
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
    const maxZIndex = Math.max(0, ...items.map(i => i.zIndex || 0));
    setItems(items.map(item => item.instanceId === instanceId ? { ...item, zIndex: maxZIndex + 1 } : item));
  };
  
  return (
    <div className="flex flex-1 flex-col bg-muted/30 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Outfit Canvas</h2>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsDownloadDialogOpen(true)} disabled={isDownloading}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSimpleDownload} disabled={isExporting}>
                    {isExporting ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <HardDriveDownload className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Exporting...' : 'Export as JPG'}
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Download Outfit</DialogTitle>
                    <DialogDescription>Choose an aspect ratio for your image.</DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                    <RadioGroup defaultValue="1:1" className='flex gap-4' onValueChange={setAspectRatio} disabled={isDownloading}>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value="1:1" id="r1"/>
                            <Label htmlFor="r1">1:1 (Square)</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value="4:5" id="r2"/>
                            <Label htmlFor="r2">4:5 (Portrait)</Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <RadioGroupItem value="9:16" id="r3"/>
                            <Label htmlFor="r3">9:16 (Story)</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <><Sparkles className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Confirm Download"}
                </Button>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={() => setItems([])}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
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
        {items.map(canvasItem => (
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
            >
                <div 
                  className={`w-full h-full relative border-2 rounded-md transition-colors ${selectedInstanceIds.includes(canvasItem.instanceId) ? 'border-primary' : 'border-transparent group-hover:border-primary group-hover:border-dashed'}`}
                  ref={el => { if(el) itemRefs.current[canvasItem.instanceId] = el}}
                >
                    <Image
                        src={canvasItem.item.photoDataUri}
                        alt={canvasItem.item.name}
                        fill
                        className="object-cover pointer-events-none"
                    />
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
                </div>
            </Rnd>
        ))}
         {items.length === 0 && !isOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-lg">Drop clothing items here to start building your outfit!</p>
            </div>
        )}
      </div>
    </div>
  );
}
