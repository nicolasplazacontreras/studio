"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { type ClothingItem, type CanvasItems } from '@/lib/types';
import { Button } from './ui/button';
import { Download, Save, Shirt, Trash2, X, ShoppingBag, Gem, Footprints } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';

interface OutfitCanvasProps {
  items: CanvasItems;
  onDrop: (item: ClothingItem) => void;
  onRemove: (category: keyof CanvasItems) => void;
  onClear: () => void;
  onSave: () => void;
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

const categoryIcons: Record<keyof CanvasItems, React.ReactNode> = {
  Hats: <HatIcon className="mx-auto h-8 w-8 mb-2" />,
  Tops: <Shirt className="mx-auto h-8 w-8 mb-2" />,
  Bottoms: <PantsIcon className="mx-auto h-8 w-8 mb-2" />,
  Shoes: <Footprints className="mx-auto h-8 w-8 mb-2" />,
  Accessories: <Gem className="mx-auto h-8 w-8 mb-2" />,
  Bags: <ShoppingBag className="mx-auto h-8 w-8 mb-2" />,
};


const DropZone = ({ item, category, onDrop, onRemove }: {
  item?: ClothingItem,
  category: keyof CanvasItems,
  onDrop: (e: React.DragEvent<HTMLDivElement>, category: keyof CanvasItems) => void,
  onRemove: (category: keyof CanvasItems) => void
}) => {
  const [isOver, setIsOver] = useState(false);
  const Icon = categoryIcons[category];

  return (
    <div
      onDrop={(e) => {
        onDrop(e, category);
        setIsOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      className={`relative flex items-center justify-center rounded-lg border-2 border-dashed transition-colors h-full ${
        isOver ? 'border-primary bg-accent' : 'border-border'
      } ${item ? 'p-0' : 'p-4'}`}
    >
      {item ? (
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
            onClick={() => onRemove(category)}
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
          <p>Drop {category}</p>
        </div>
      )}
    </div>
  );
};


export default function OutfitCanvas({ items, onDrop, onRemove, onClear, onSave }: OutfitCanvasProps) {
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: keyof CanvasItems) => {
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

  const handleDownload = () => {
    toast({
        title: "Feature in development",
        description: "Downloading outfit images will be available soon!",
    });
  }

  return (
    <div className="flex flex-1 flex-col bg-muted/30 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Outfit Canvas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
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
                    <RadioGroup defaultValue="1:1" className='flex gap-4'>
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
                <Button onClick={handleDownload}>Confirm Download</Button>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-4">
        <div className="col-start-1 row-start-1">
            <DropZone item={items.Hats} category="Hats" onDrop={handleDrop} onRemove={onRemove} />
        </div>
        <div className="col-start-2 row-start-1">
            <DropZone item={items.Tops} category="Tops" onDrop={handleDrop} onRemove={onRemove} />
        </div>
        
        <div className="col-start-1 row-start-2">
            <DropZone item={items.Accessories} category="Accessories" onDrop={handleDrop} onRemove={onRemove} />
        </div>
        <div className="col-start-2 row-start-2">
            <DropZone item={items.Bottoms} category="Bottoms" onDrop={handleDrop} onRemove={onRemove} />
        </div>
        <div className="col-start-3 row-start-2">
            <DropZone item={items.Bags} category="Bags" onDrop={handleDrop} onRemove={onRemove} />
        </div>

        <div className="col-start-2 row-start-3">
            <DropZone item={items.Shoes} category="Shoes" onDrop={handleDrop} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
}
