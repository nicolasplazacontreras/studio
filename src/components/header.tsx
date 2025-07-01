"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { GalleryHorizontal } from 'lucide-react';
import { ThemeSlider } from './theme-slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import OutfitGalleryClient from './outfit-gallery-client';
import { ScrollArea } from './ui/scroll-area';
import { type CanvasItem } from '@/lib/types';

interface HeaderProps {
  onLoadOutfit: (items: CanvasItem[]) => void;
}

export default function Header({ onLoadOutfit }: HeaderProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleLoadAndClose = (items: CanvasItem[]) => {
    onLoadOutfit(items);
    setIsGalleryOpen(false);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
      <Link href="/" className="text-xl font-semibold tracking-tighter text-primary">
        WRDROBE
      </Link>
      <nav className="flex items-center gap-2">
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setIsGalleryOpen(true)}>
              <GalleryHorizontal className="mr-2 h-4 w-4" />
              My Outfits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>My Saved Outfits</DialogTitle>
              <DialogDescription>
                Here are all the outfits you've created and saved. Click one to load it onto the canvas.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6">
                <div className="px-6 pb-6">
                    <OutfitGalleryClient onLoadOutfit={handleLoadAndClose} />
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <ThemeSlider />
      </nav>
    </header>
  );
}
