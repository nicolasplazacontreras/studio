"use client";

import Image from 'next/image';
import type { ClothingItem } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Trash2, Pencil } from 'lucide-react';

interface ClothingItemCardProps {
  item: ClothingItem;
  onDelete: () => void;
  onEdit: () => void;
}

export function ClothingItemCard({ item, onDelete, onEdit }: ClothingItemCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className="group relative cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-0">
        <Image
          src={item.photoDataUri}
          alt={item.name}
          width={200}
          height={200}
          data-ai-hint={item['data-ai-hint']}
          className="aspect-square w-full rounded-md object-cover"
        />
        <div className="absolute inset-0 rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
        <p className="absolute bottom-2 left-2 text-sm font-medium text-white drop-shadow-md opacity-0 transition-opacity group-hover:opacity-100">
          {item.name}
        </p>
        <Button
          size="icon"
          variant="outline"
          className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
