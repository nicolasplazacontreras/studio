import Link from 'next/link';
import { Button } from './ui/button';
import { GalleryHorizontal } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
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

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
      <Link href="/" className="text-xl font-semibold tracking-tighter text-primary">
        WRDROBE
      </Link>
      <nav className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <GalleryHorizontal className="mr-2 h-4 w-4" />
              My Outfits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>My Saved Outfits</DialogTitle>
              <DialogDescription>
                Here are all the outfits you've created and saved.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6">
                <div className="px-6 pb-6">
                    <OutfitGalleryClient />
                </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <ThemeToggle />
      </nav>
    </header>
  );
}
