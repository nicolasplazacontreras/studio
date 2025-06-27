"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import { type Outfit } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const getItemStyle = (category: string): React.CSSProperties => {
    switch (category) {
        case 'Tops':
            return { top: '15%', left: 0, width: '100%', height: '60%' };
        case 'Bottoms':
            return { bottom: '20%', left: 0, width: '100%', height: '50%' };
        case 'Shoes':
            return { bottom: 0, left: '25%', width: '50%', height: '25%' };
        case 'Hats':
            return { top: 0, left: '25%', width: '50%', height: '20%' };
        case 'Bags':
            return { top: '50%', right: '5%', width: '30%', height: '30%', transform: 'translateY(-50%)' };
        case 'Accessories':
        default:
            return { top: '20%', right: '5%', width: '30%', height: '30%' };
    }
}

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
          <CardContent className="p-0 aspect-square relative bg-gray-100">
            {Object.values(outfit.items).map((item) => (
              <Image
                key={item.id}
                src={item.photoDataUri}
                alt={item.name}
                width={200}
                height={200}
                className="absolute object-contain drop-shadow-md"
                style={getItemStyle(item.category)}
              />
            ))}
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
