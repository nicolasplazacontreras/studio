"use client"

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { type SuggestOutfitOutput } from '@/ai/flows/suggest-outfit';

interface AiSuggestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: SuggestOutfitOutput | null;
  onUseOutfit: (items: {name: string, category: string, photoDataUri: string}[]) => void;
}

export default function AiSuggestionsDialog({ isOpen, onOpenChange, suggestions, onUseOutfit }: AiSuggestionsDialogProps) {
  if (!suggestions) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Outfit Suggestions</DialogTitle>
          <DialogDescription>
            Here are a few outfits our AI thinks you'll like.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Carousel>
            <CarouselContent>
              {suggestions.outfitSuggestions.map((suggestion, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex flex-col md:flex-row items-center justify-center p-6 gap-6">
                        <div className="relative w-64 h-64 shrink-0">
                          {suggestion.items.map((item, itemIndex) => {
                             let style: React.CSSProperties = {};
                             switch (item.category.toLowerCase()) {
                               case 'tops':
                                 style = { top: '0', left: '0', width: '100%', height: '60%' };
                                 break;
                               case 'bottoms':
                                 style = { bottom: '0', left: '0', width: '100%', height: '50%' };
                                 break;
                               case 'shoes':
                                 style = { bottom: '0', right: '0', width: '45%', height: '25%' };
                                 break;
                               case 'accessories':
                                 style = { top: '5%', right: '5%', width: '30%', height: '30%' };
                                 break;
                             }
                             return (
                               <Image
                                 key={itemIndex}
                                 src={item.photoDataUri}
                                 alt={item.name}
                                 width={150}
                                 height={150}
                                 className="absolute object-contain drop-shadow-lg"
                                 style={style}
                               />
                             );
                          })}
                        </div>
                        <div className="flex flex-col gap-4 text-center md:text-left">
                          <h3 className="font-semibold text-lg">Outfit Suggestion #{index + 1}</h3>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          <ul className="text-sm list-disc list-inside">
                            {suggestion.items.map(item => <li key={item.name}>{item.name}</li>)}
                          </ul>
                          <Button onClick={() => onUseOutfit(suggestion.items)} className="mt-4 w-full md:w-auto">
                            Use this Outfit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
