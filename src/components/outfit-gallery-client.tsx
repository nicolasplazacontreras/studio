"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { type Outfit } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1200;

export default function OutfitGalleryClient() {
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const outfitsFromStorage = JSON.parse(localStorage.getItem('wrdrobe_outfits') || '[]');
    setSavedOutfits(outfitsFromStorage);
  }, []);

  const handleDeleteOutfit = (outfitId: string) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {savedOutfits.map((outfit) => (
        <Card key={outfit.id} className="group relative overflow-hidden">
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
                    imageStyle.maskImage = `url(${canvasItem.item.maskDataUri})`;
                    imageStyle.WebkitMaskImage = `url(${canvasItem.item.maskDataUri})`;
                    imageStyle.maskSize = 'cover';
                    imageStyle.WebkitMaskSize = 'cover';
                    imageStyle.maskRepeat = 'no-repeat';
                    imageStyle.WebkitMaskRepeat = 'no-repeat';
                    imageStyle.maskPosition = 'center';
                    imageStyle.WebkitMaskPosition = 'center';
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
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => handleDeleteOutfit(outfit.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
