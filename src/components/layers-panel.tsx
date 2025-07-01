"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { type CanvasItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

interface LayersPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  items: CanvasItem[];
  setItems: (items: CanvasItem[]) => void;
  keepLayersOrder: boolean;
  onKeepLayersOrderChange: (checked: boolean) => void;
}

export function LayersPanel({ isOpen, onOpenChange, items, setItems, keepLayersOrder, onKeepLayersOrderChange }: LayersPanelProps) {
  const [draggedItemInstanceId, setDraggedItemInstanceId] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  }, [items]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, instanceId: string) => {
    setDraggedItemInstanceId(instanceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetInstanceId: string) => {
    e.preventDefault();
    if (!draggedItemInstanceId || draggedItemInstanceId === targetInstanceId) {
        setDraggedItemInstanceId(null);
        return;
    }

    const draggedItemIndex = sortedItems.findIndex(item => item.instanceId === draggedItemInstanceId);
    const targetItemIndex = sortedItems.findIndex(item => item.instanceId === targetInstanceId);

    if (draggedItemIndex === -1 || targetItemIndex === -1) return;

    const newSortedItems = [...sortedItems];
    const [removed] = newSortedItems.splice(draggedItemIndex, 1);
    newSortedItems.splice(targetItemIndex, 0, removed);
    
    const totalItems = newSortedItems.length;
    const updatedCanvasItems = newSortedItems.map((item, index) => ({
      ...item,
      zIndex: totalItems - index, // Re-assign zIndex based on new order
    }));

    setItems(updatedCanvasItems);
    setDraggedItemInstanceId(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItemInstanceId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>Edit Layers</SheetTitle>
          <SheetDescription>
            Drag and drop items to reorder them on the canvas. The top item is the front-most layer.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
                {sortedItems.map((canvasItem) => (
                    <div
                        key={canvasItem.instanceId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, canvasItem.instanceId)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, canvasItem.instanceId)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                            "flex items-center p-2 rounded-md border bg-card cursor-grab active:cursor-grabbing transition-all",
                            draggedItemInstanceId === canvasItem.instanceId && 'opacity-50 scale-105 shadow-lg'
                        )}
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground mr-2 shrink-0"/>
                        <Image
                            src={canvasItem.item.photoDataUri}
                            alt={canvasItem.item.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 object-cover rounded-sm mr-4"
                        />
                        <span className="font-medium text-sm truncate flex-1">
                            {canvasItem.item.name}
                        </span>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="p-4 border-t shrink-0">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="keep-layers-order"
              checked={keepLayersOrder}
              onCheckedChange={onKeepLayersOrderChange}
            />
            <Label htmlFor="keep-layers-order" className="cursor-pointer">
              Keep layers order
            </Label>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
