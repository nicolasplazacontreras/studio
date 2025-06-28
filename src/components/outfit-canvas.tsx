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
  onDrop: (item: ClothingItem, position: { x: number, y: number }) => void;
  onRemoveItem: (instanceId: string) => void;
  onUpdateItem: (instanceId: string, updates: Partial<CanvasItem>) => void;
  onBringToFront: (instanceId: string) => void;
  onClear: () => void;
  onSave: () => void;
}

export default function OutfitCanvas({ items, onDrop, onRemoveItem, onUpdateItem, onBringToFront, onClear, onSave }: OutfitCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;
    
    const item: ClothingItem = JSON.parse(itemData);
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    onDrop(item, { x, y });
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
    if (!canvasRef.current) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the canvas to export.",
        });
        return;
    }
    if (items.length === 0) {
        toast({
            variant: "destructive",
            title: "Canvas is empty",
            description: "Add some items to the canvas to download an outfit.",
        });
        return;
    }

    setIsExporting(true);
    toast({ title: "Preparing your image..." });

    try {
        const dataUrl = await toJpeg(canvasRef.current, { quality: 0.95, style: { background: 'white' } });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `wrdrobe-outfit-canvas-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: "Download started!",
            description: "Your outfit image is being downloaded.",
        });
    } catch (error) {
        console.error("Simple download failed:", error);
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "Could not export the canvas image. Please try again.",
        });
    } finally {
        setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (items.length === 0) {
        toast({
            variant: "destructive",
            title: "Canvas is empty",
            description: "Add some items to the canvas to download an outfit.",
        });
        return;
    }

    setIsDownloading(true);
    toast({
        title: "Generating your outfit image...",
        description: "This might take a moment.",
    });

    try {
        const outfitItems = items.map(canvasItem => ({
            photoDataUri: canvasItem.item.photoDataUri,
            category: canvasItem.item.category,
        }));

        const result = await generateOutfitImage({
            items: outfitItems,
            aspectRatio: aspectRatio,
        });

        const link = document.createElement('a');
        link.href = result.photoDataUri;
        link.download = `wrdrobe-outfit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDownloadDialogOpen(false);
        toast({
            title: "Download started!",
            description: "Your outfit image is being downloaded.",
        });

    } catch (error) {
        console.error("Download failed:", error);
        toast({
            variant: "destructive",
            title: "Download Failed",
            description: "Could not generate the outfit image. Please try again.",
        });
    } finally {
        setIsDownloading(false);
    }
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
                    {isDownloading ? (
                        <>
                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Confirm Download"
                    )}
                </Button>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={onClear}>
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
      >
        {items.map(canvasItem => (
            <Rnd
                key={canvasItem.instanceId}
                size={{ width: canvasItem.width, height: canvasItem.height }}
                position={{ x: canvasItem.x, y: canvasItem.y }}
                style={{ zIndex: canvasItem.zIndex }}
                minWidth={50}
                minHeight={50}
                onDragStop={(e, d) => {
                    onUpdateItem(canvasItem.instanceId, { x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                    onUpdateItem(canvasItem.instanceId, {
                        width: ref.offsetWidth,
                        height: ref.offsetHeight,
                        ...position,
                    });
                }}
                onMouseDown={() => onBringToFront(canvasItem.instanceId)}
                bounds="parent"
                className="group"
            >
                <div className="w-full h-full relative border-2 border-transparent group-hover:border-primary group-hover:border-dashed rounded-md">
                    <Image
                        src={canvasItem.item.photoDataUri}
                        alt={canvasItem.item.name}
                        fill
                        className="object-contain pointer-events-none"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(canvasItem.instanceId)
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
