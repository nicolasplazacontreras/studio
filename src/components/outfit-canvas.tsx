"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { type ClothingItem, type CanvasItems, type LayoutItem } from '@/lib/types';
import { Button } from './ui/button';
import { Download, Save, Shirt, Trash2, X, ShoppingBag, Gem, Footprints, Pencil, Plus, GripVertical, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { AddDropZoneDialog } from './add-dropzone-dialog';
import { generateOutfitImage } from '@/ai/flows/generate-outfit-image';

interface OutfitCanvasProps {
  items: CanvasItems;
  layout: LayoutItem[];
  setLayout: React.Dispatch<React.SetStateAction<LayoutItem[]>>;
  onDrop: (item: ClothingItem) => void;
  onRemoveItem: (category: keyof CanvasItems) => void;
  onClear: () => void;
  onSave: () => void;
  onAddZone: (category: string) => void;
  onRemoveZone: (zoneId: string) => void;
  allCategories: string[];
}

const HatIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a5 5 0 0 0-5 5v1h10V7a5 5 0 0 0-5-5Z"/>
    <path d="M12 8H2.5A1.5 1.5 0 0 0 1 9.5V11h22V9.5A1.5 1.5 0 0 0 21.5 8H12Z"/>
  </svg>
);

const PantsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 2v10H6v10h5" />
    <path d="M15 2v10h3v10h-5" />
    <path d="M9 2h6" />
  </svg>
);

const categoryIcons: Record<string, React.ReactNode> = {
  Hats: <HatIcon className="mx-auto h-8 w-8 mb-2" />,
  Tops: <Shirt className="mx-auto h-8 w-8 mb-2" />,
  Bottoms: <PantsIcon className="mx-auto h-8 w-8 mb-2" />,
  Shoes: <Footprints className="mx-auto h-8 w-8 mb-2" />,
  Accessories: <Gem className="mx-auto h-8 w-8 mb-2" />,
  Bags: <ShoppingBag className="mx-auto h-8 w-8 mb-2" />,
};


const DropZone = ({ 
    item,
    category,
    onDrop,
    onRemoveItem,
    isEditing,
    onRemoveZone,
    zoneId,
    onZoneDragStart,
    onZoneDrop,
    isBeingDragged
}: {
  item?: ClothingItem,
  category: string,
  onDrop: (e: React.DragEvent<HTMLDivElement>, category: string) => void,
  onRemoveItem: (category: string) => void,
  isEditing: boolean,
  onRemoveZone: () => void,
  zoneId: string,
  onZoneDragStart: (e: React.DragEvent<HTMLDivElement>, zoneId:string) => void,
  onZoneDrop: (e: React.DragEvent<HTMLDivElement>, zoneId: string) => void,
  isBeingDragged: boolean
}) => {
  const [isOver, setIsOver] = useState(false);
  const Icon = categoryIcons[category] || <Shirt className="mx-auto h-8 w-8 mb-2" />;
  const dataTransferTypeZone = 'application/vnd.wrdrobe.zone-id';

  return (
    <div
      draggable={isEditing}
      onDragStart={(e) => { if (isEditing) onZoneDragStart(e, zoneId) }}
      onDrop={(e) => {
        setIsOver(false);
        const draggedZoneId = e.dataTransfer.getData(dataTransferTypeZone);
        const draggedItemId = e.dataTransfer.getData('application/json');
        
        if (isEditing && draggedZoneId) {
            onZoneDrop(e, zoneId);
        } else if (!isEditing && draggedItemId) {
            onDrop(e, category);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (isEditing) {
          e.dataTransfer.dropEffect = "move";
        }
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      className={`relative flex items-center justify-center rounded-lg border-2 border-dashed transition-all h-full
      ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
      ${isOver && (isEditing || !item) ? 'border-primary bg-accent' : 'border-border'} 
      ${item && !isEditing ? 'p-0' : 'p-4'}
      ${isBeingDragged ? 'opacity-30' : 'opacity-100'}
      `}
    >
      {isEditing ? (
        <>
            <GripVertical className="absolute top-1/2 left-2 -translate-y-1/2 h-6 w-6 text-muted-foreground pointer-events-none" />
            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 z-20" onClick={onRemoveZone}>
                <Trash2 className="h-4 w-4" />
            </Button>
            <div className="text-center text-muted-foreground pointer-events-none">
              {Icon}
              <p>{category}</p>
            </div>
        </>
      ) : item ? (
        <div className="group relative w-full h-full">
          <Image
            src={item.photoDataUri}
            alt={item.name}
            fill
            className="rounded-md object-cover"
          />
          <div className="absolute inset-0 bg-black/20 rounded-md" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => onRemoveItem(category)}
          >
            <X className="h-4 w-4" />
          </Button>
          <p className="absolute bottom-2 left-2 text-sm font-medium text-white drop-shadow-md z-10">
            {item.name}
          </p>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {Icon}
          <p>{category}</p>
        </div>
      )}
    </div>
  );
};


export default function OutfitCanvas({ items, layout, setLayout, onDrop, onRemoveItem, onClear, onSave, onAddZone, onRemoveZone, allCategories }: OutfitCanvasProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draggedZoneId, setDraggedZoneId] = useState<string | null>(null);
  const dataTransferTypeZone = 'application/vnd.wrdrobe.zone-id';

  const [isDownloading, setIsDownloading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: string) => {
    e.preventDefault();
    const itemData = e.dataTransfer.getData('application/json');
    if (itemData) {
      const item: ClothingItem = JSON.parse(itemData);
      if (item.category === targetCategory) {
        onDrop(item);
      } else {
        toast({
            variant: 'destructive',
            title: 'Wrong Category',
            description: `This item belongs in ${item.category}, not ${targetCategory}.`,
        });
      }
    }
  };

  const handleDownload = async () => {
    if (Object.values(items).every(item => !item)) {
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
        const outfitItems = Object.values(items)
            .filter((item): item is ClothingItem => !!item)
            .map(item => ({
                photoDataUri: item.photoDataUri,
                category: item.category,
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
  
  const handleZoneDragStart = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
      e.dataTransfer.setData(dataTransferTypeZone, zoneId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedZoneId(zoneId);
  };

  const handleZoneDrop = (e: React.DragEvent<HTMLDivElement>, targetZoneId: string) => {
    e.preventDefault();
    const sourceZoneId = e.dataTransfer.getData(dataTransferTypeZone);
    
    if (sourceZoneId && sourceZoneId !== targetZoneId) {
        setLayout(prevLayout => {
            const sourceZone = prevLayout.find(z => z.id === sourceZoneId);
            const targetZone = prevLayout.find(z => z.id === targetZoneId);

            if (!sourceZone || !targetZone) return prevLayout;

            const newLayout = prevLayout.map(zone => {
                if (zone.id === sourceZoneId) {
                    return { ...zone, row: targetZone.row, col: targetZone.col };
                }
                if (zone.id === targetZoneId) {
                    return { ...zone, row: sourceZone.row, col: sourceZone.col };
                }
                return zone;
            });

            return newLayout;
        });
    }
    setDraggedZoneId(null);
  };


  const currentCategoriesOnCanvas = layout.map(l => l.category);

  return (
    <div className="flex flex-1 flex-col bg-muted/30 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Outfit Canvas</h2>
        <div className="flex items-center gap-2">
           <Button variant={isEditing ? 'default' : 'outline'} size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="mr-2 h-4 w-4" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm" onClick={onSave} disabled={isEditing}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isEditing}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
            </DialogTrigger>
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
          <Button variant="destructive" size="sm" onClick={onClear} disabled={isEditing}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4">
        {layout.map(zone => (
            <div key={zone.id} style={{ gridRow: zone.row, gridColumn: zone.col }}>
                <DropZone
                    item={items[zone.category]}
                    category={zone.category}
                    onDrop={handleDrop}
                    onRemoveItem={onRemoveItem}
                    isEditing={isEditing}
                    onRemoveZone={() => onRemoveZone(zone.id)}
                    zoneId={zone.id}
                    onZoneDragStart={handleZoneDragStart}
                    onZoneDrop={handleZoneDrop}
                    isBeingDragged={draggedZoneId === zone.id}
                />
            </div>
        ))}
         {isEditing && (
            <div className='flex items-center justify-center'>
                <AddDropZoneDialog
                    onAddZone={onAddZone}
                    allCategories={allCategories}
                    currentCategoriesOnCanvas={currentCategoriesOnCanvas}
                >
                    <Button variant="outline" className='h-full w-full border-dashed'>
                        <Plus className="h-6 w-6 mr-2" />
                        Add Zone
                    </Button>
                </AddDropZoneDialog>
            </div>
        )}
      </div>
    </div>
  );
}
