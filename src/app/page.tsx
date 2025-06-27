"use client"

import { useState, useEffect } from 'react';
import { type ClothingItem, type Outfit, type CanvasItems } from '@/lib/types';
import WardrobeSidebar from '@/components/wardrobe-sidebar';
import OutfitCanvas from '@/components/outfit-canvas';
import Header from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { suggestOutfit, type SuggestOutfitOutput } from '@/ai/flows/suggest-outfit';
import AiSuggestionsDialog from '@/components/ai-suggestions-dialog';

const initialWardrobe: ClothingItem[] = [
  { id: '1', name: 'White T-Shirt', category: 'Tops', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "white t-shirt" },
  { id: '2', name: 'Blue Jeans', category: 'Bottoms', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "blue jeans" },
  { id: '3', name: 'White Sneakers', category: 'Shoes', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "white sneakers" },
  { id: '4', name: 'Black Leather Jacket', category: 'Tops', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "leather jacket" },
  { id: '5', name: 'Beige Chinos', category: 'Bottoms', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "beige chinos" },
  { id: '6', name: 'Brown Loafers', category: 'Shoes', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "brown loafers" },
  { id: '7', name: 'Gold Necklace', category: 'Accessories', photoDataUri: 'https://placehold.co/400x400.png', "data-ai-hint": "gold necklace" },
];

export default function Home() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItems>({});
  const [aiSuggestions, setAiSuggestions] = useState<SuggestOutfitOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load wardrobe from localStorage or use initial data
    const savedWardrobe = localStorage.getItem('wrdrobe_wardrobe');
    if (savedWardrobe) {
      setWardrobe(JSON.parse(savedWardrobe));
    } else {
      setWardrobe(initialWardrobe);
    }
  }, []);

  useEffect(() => {
    // Save wardrobe to localStorage whenever it changes
    if(wardrobe.length > 0) {
      localStorage.setItem('wrdrobe_wardrobe', JSON.stringify(wardrobe));
    }
  }, [wardrobe]);


  const handleAddItem = (item: Omit<ClothingItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setWardrobe(prev => [...prev, newItem]);
    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to your wardrobe.`,
    });
  };

  const handleDropOnCanvas = (item: ClothingItem) => {
    setCanvasItems(prev => ({ ...prev, [item.category]: item }));
  };

  const handleRemoveFromCanvas = (category: keyof CanvasItems) => {
    setCanvasItems(prev => {
      const newItems = { ...prev };
      delete newItems[category];
      return newItems;
    });
  };

  const handleClearCanvas = () => {
    setCanvasItems({});
  };

  const handleSaveOutfit = () => {
    if (Object.keys(canvasItems).length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Outfit",
        description: "Add some items to the canvas before saving.",
      });
      return;
    }
    const savedOutfits: Outfit[] = JSON.parse(localStorage.getItem('wrdrobe_outfits') || '[]');
    const newOutfit: Outfit = { id: Date.now().toString(), items: canvasItems };
    localStorage.setItem('wrdrobe_outfits', JSON.stringify([newOutfit, ...savedOutfits]));
    toast({
      title: "Outfit Saved!",
      description: "Your new outfit has been saved to your gallery.",
    });
  };
  
  const handleDeleteItem = (itemId: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== itemId));
    // Also remove from canvas if it's there
    Object.entries(canvasItems).forEach(([category, item]) => {
        if (item.id === itemId) {
            handleRemoveFromCanvas(category as keyof CanvasItems);
        }
    });
    toast({
      title: "Item Deleted",
      description: "The item has been removed from your wardrobe.",
    });
  };

  const handleGetAiSuggestions = async () => {
    if (wardrobe.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Clothing',
        description: 'Please add at least 3 items to your wardrobe for AI suggestions.',
      });
      return;
    }
    setIsAiLoading(true);
    try {
      const suggestions = await suggestOutfit({
        clothingItems: wardrobe.map(item => ({
          name: item.name,
          category: item.category,
          photoDataUri: item.photoDataUri,
          description: '',
        })),
      });
      setAiSuggestions(suggestions);
      setIsAiDialogOpen(true);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not generate outfit suggestions. Please try again.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUseSuggestedOutfit = (suggestedItems: {name: string, category: string, photoDataUri: string}[]) => {
    const newCanvasItems: CanvasItems = {};
    suggestedItems.forEach(suggestedItem => {
        const wardrobeItem = wardrobe.find(item => item.name === suggestedItem.name && item.photoDataUri === suggestedItem.photoDataUri);
        if (wardrobeItem) {
            newCanvasItems[wardrobeItem.category as keyof CanvasItems] = wardrobeItem;
        }
    });
    setCanvasItems(newCanvasItems);
    setIsAiDialogOpen(false);
    toast({
        title: 'Outfit Applied',
        description: 'The suggested outfit is now on your canvas.',
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <WardrobeSidebar
          items={wardrobe}
          onAddItem={handleAddItem}
          onGetAiSuggestions={handleGetAiSuggestions}
          isAiLoading={isAiLoading}
          onDeleteItem={handleDeleteItem}
        />
        <OutfitCanvas
          items={canvasItems}
          onDrop={handleDropOnCanvas}
          onRemove={handleRemoveFromCanvas}
          onClear={handleClearCanvas}
          onSave={handleSaveOutfit}
        />
      </main>
      {aiSuggestions && (
        <AiSuggestionsDialog
          isOpen={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          suggestions={aiSuggestions}
          onUseOutfit={handleUseSuggestedOutfit}
        />
      )}
    </div>
  );
}
