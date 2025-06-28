"use client"

import { useState, useEffect } from 'react';
import { type ClothingItem, type Outfit, type CanvasItems, type LayoutItem } from '@/lib/types';
import WardrobeSidebar from '@/components/wardrobe-sidebar';
import OutfitCanvas from '@/components/outfit-canvas';
import Header from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { suggestOutfit, type SuggestOutfitOutput } from '@/ai/flows/suggest-outfit';
import AiSuggestionsDialog from '@/components/ai-suggestions-dialog';

const initialWardrobe: ClothingItem[] = [
  { id: '1', name: 'White T-Shirt', category: 'Tops', photoDataUri: 'https://placehold.co/400x400.png', tags: ['summer', 'casual', 'basic'], "data-ai-hint": "white t-shirt" },
  { id: '2', name: 'Blue Jeans', category: 'Bottoms', photoDataUri: 'https://placehold.co/400x400.png', tags: ['casual', 'denim'], "data-ai-hint": "blue jeans" },
  { id: '3', name: 'White Sneakers', category: 'Shoes', photoDataUri: 'https://placehold.co/400x400.png', tags: ['casual', 'summer'], "data-ai-hint": "white sneakers" },
  { id: '4', name: 'Black Leather Jacket', category: 'Tops', photoDataUri: 'https://placehold.co/400x400.png', tags: ['winter', 'going-out'], "data-ai-hint": "leather jacket" },
  { id: '5', name: 'Beige Chinos', category: 'Bottoms', photoDataUri: 'https://placehold.co/400x400.png', tags: ['smart-casual', 'work'], "data-ai-hint": "beige chinos" },
  { id: '6', name: 'Brown Loafers', category: 'Shoes', photoDataUri: 'https://placehold.co/400x400.png', tags: ['smart-casual', 'work'], "data-ai-hint": "brown loafers" },
  { id: '7', name: 'Gold Necklace', category: 'Accessories', photoDataUri: 'https://placehold.co/400x400.png', tags: ['jewelry', 'going-out'], "data-ai-hint": "gold necklace" },
  { id: '8', name: 'Baseball Cap', category: 'Hats', photoDataUri: 'https://placehold.co/400x400.png', tags: ['casual', 'summer'], "data-ai-hint": "baseball cap" },
  { id: '9', name: 'Leather Backpack', category: 'Bags', photoDataUri: 'https://placehold.co/400x400.png', tags: ['casual', 'work'], "data-ai-hint": "leather backpack" },
];

const initialLayout: LayoutItem[] = [
  { id: 'hats', category: 'Hats', row: 1, col: 1 },
  { id: 'tops', category: 'Tops', row: 1, col: 2 },
  { id: 'accessories', category: 'Accessories', row: 2, col: 1 },
  { id: 'bottoms', category: 'Bottoms', row: 2, col: 2 },
  { id: 'bags', category: 'Bags', row: 2, col: 3 },
  { id: 'shoes', category: 'Shoes', row: 3, col: 2 },
];
const initialCategories = ['Hats', 'Tops', 'Bottoms', 'Shoes', 'Accessories', 'Bags'];
const allGridSlots = Array.from({ length: 9 }, (_, i) => ({ row: Math.floor(i / 3) + 1, col: (i % 3) + 1 }));

export default function Home() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItems>({});
  const [aiSuggestions, setAiSuggestions] = useState<SuggestOutfitOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Load data from localStorage
    const savedWardrobe = localStorage.getItem('wrdrobe_wardrobe');
    setWardrobe(savedWardrobe ? JSON.parse(savedWardrobe) : initialWardrobe);

    const savedLayout = localStorage.getItem('wrdrobe_layout');
    setLayout(savedLayout ? JSON.parse(savedLayout) : initialLayout);

    const savedCategories = localStorage.getItem('wrdrobe_categories');
    setCategories(savedCategories ? JSON.parse(savedCategories) : initialCategories);
  }, []);

  useEffect(() => {
    // Save wardrobe to localStorage whenever it changes
    if(wardrobe.length > 0) localStorage.setItem('wrdrobe_wardrobe', JSON.stringify(wardrobe));
  }, [wardrobe]);

  useEffect(() => {
    if(layout.length > 0) localStorage.setItem('wrdrobe_layout', JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    if(categories.length > 0) localStorage.setItem('wrdrobe_categories', JSON.stringify(categories));
  }, [categories]);


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
        if (item && item.id === itemId) {
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
          tags: item.tags,
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

  const handleAddDropZone = (category: string) => {
    if (layout.map(l => l.category).includes(category)) {
      toast({ variant: 'destructive', title: 'Category already on canvas' });
      return;
    }

    const occupiedSlots = new Set(layout.map(zone => `${zone.row}-${zone.col}`));
    const availableSlot = allGridSlots.find(slot => !occupiedSlots.has(`${slot.row}-${slot.col}`));

    if (!availableSlot) {
      toast({ variant: 'destructive', title: 'Canvas is full', description: 'No more space to add a new drop zone.' });
      return;
    }
    
    const newZone: LayoutItem = {
        id: Date.now().toString(),
        category,
        row: availableSlot.row,
        col: availableSlot.col,
    };
    
    if (!categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }

    setLayout(prev => [...prev, newZone]);
    toast({ title: 'Drop Zone Added', description: `Category "${category}" is now on the canvas.` });
  };

  const handleRemoveDropZone = (zoneId: string) => {
    const zoneToRemove = layout.find(z => z.id === zoneId);
    if (!zoneToRemove) return;

    // Remove any item that was in the zone
    handleRemoveFromCanvas(zoneToRemove.category);

    setLayout(prev => prev.filter(z => z.id !== zoneId));
    toast({ title: 'Drop Zone Removed', description: `Category "${zoneToRemove.category}" removed from canvas.` });
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
          categories={categories}
        />
        <OutfitCanvas
          items={canvasItems}
          layout={layout}
          setLayout={setLayout}
          onDrop={handleDropOnCanvas}
          onRemoveItem={handleRemoveFromCanvas}
          onClear={handleClearCanvas}
          onSave={handleSaveOutfit}
          onAddZone={handleAddDropZone}
          onRemoveZone={handleRemoveDropZone}
          allCategories={categories}
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
