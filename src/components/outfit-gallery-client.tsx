"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { type Outfit, type CanvasItem } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1200;

interface OutfitGalleryClientProps {
  onLoadOutfit: (items: CanvasItem[]) => void;
}

export default function OutfitGalleryClient({ onLoadOutfit }: OutfitGalleryClientProps) {
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const outfitsFromStorage = JSON.parse(localStorage.getItem('wrdrobe_outfits') || '[]');
    // Add a safety check to filter out any items that don't have a valid `items` array
    setSavedOutfits(outfitsFromStorage.filter((outfit: any) => Array.isArray(outfit.items)));
  }, []);

  const handleDeleteOutfit = (e: React.MouseEvent, outfitId: string) => {
    e.stopPropagation(); // Prevents the card's onClick from firing
    const newOutfits = savedOutfits.filter(outfit => outfit.id !== outfitId);
    setSavedOutfits(newOutfits);
    localStorage.setItem('wrdrobe_outfits', JSON.stringify(newOutfits));
    toast({
      title: "Outfit Deleted",
      description: "The outfit has been removed from your gallery.",
    });
  };

  if (savedOutfits.length === 0) {
    return (
        <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">You haven't saved any outfits yet.</p>
            <p className="text-sm text-muted-foreground">Go to the canvas to create your first one!</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {savedOutfits.map((outfit) => (
        <Card 
          key={outfit.id} 
          className="group relative overflow-hidden cursor-pointer hover:border-primary transition-colors"
          onClick={() => onLoadOutfit(outfit.items)}
        >
          <CardContent className="p-0 aspect-square relative bg-gray-100 dark:bg-muted/40">
            <div className="absolute w-full h-full">
              {outfit.items.map((canvasItem) => {
                const containerStyle: React.CSSProperties = {
                  left: `${(canvasItem.x / CANVAS_WIDTH) * 100}%`,
                  top: `${(canvasItem.y / CANVAS_HEIGHT) * 100}%`,
                  width: `${(canvasItem.width / CANVAS_WIDTH) * 100}%`,
                  height: `${(canvasItem.height / CANVAS_HEIGHT) * 100}%`,
                  zIndex: canvasItem.zIndex,
                };

                const imageStyle: React.CSSProperties = { objectFit: 'cover' };
                if (canvasItem.item.maskDataUri) {
                    const style = imageStyle as any;
                    style.maskImage = `url(${canvasItem.item.maskDataUri})`;
                    style.maskMode = 'luminance';
                    style.maskSize = 'cover';
                    style.maskRepeat = 'no-repeat';
                    style.maskPosition = 'center';
                    style.WebkitMaskImage = `url(${canvasItem.item.maskDataUri})`;
                    style.WebkitMaskMode = 'luminance';
                    style.WebkitMaskSize = 'cover';
                    style.WebkitMaskRepeat = 'no-repeat';
                    style.WebkitMaskPosition = 'center';
                }
                
                return (
                  <div
                    key={canvasItem.instanceId}
                    className="absolute"
                    style={containerStyle}
                  >
                    <Image
                      src={canvasItem.item.photoDataUri}
                      alt={canvasItem.item.name}
                      fill
                      className="drop-shadow-md"
                      style={imageStyle}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
          <div className="absolute bottom-0 w-full p-4 text-white bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
            <h3 className="font-semibold text-lg drop-shadow-md truncate">{outfit.name || 'Untitled Outfit'}</h3>
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => handleDeleteOutfit(e, outfit.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
