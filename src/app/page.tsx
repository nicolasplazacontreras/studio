"use client"

import { useState, useEffect } from 'react';
import { type ClothingItem, type Outfit, type CanvasItem } from '@/lib/types';
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

const initialCategories = ['Hats', 'Tops', 'Bottoms', 'Shoes', 'Accessories', 'Bags'];

export default function Home() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestOutfitOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Load data from localStorage
    const savedWardrobe = localStorage.getItem('wrdrobe_wardrobe');
    setWardrobe(savedWardrobe ? JSON.parse(savedWardrobe) : initialWardrobe);
    
    const savedCategories = localStorage.getItem('wrdrobe_categories');
    setCategories(savedCategories ? JSON.parse(savedCategories) : initialCategories);
  }, []);

  useEffect(() => {
    // Save wardrobe to localStorage whenever it changes
    if(wardrobe.length > 0) localStorage.setItem('wrdrobe_wardrobe', JSON.stringify(wardrobe));
  }, [wardrobe]);

  useEffect(() => {
    if(categories.length > 0) localStorage.setItem('wrdrobe_categories', JSON.stringify(categories));
  }, [categories]);


  const handleAddItem = (item: Omit<ClothingItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setWardrobe(prev => [...prev, newItem]);
    
    if (!categories.includes(newItem.category)) {
      setCategories(prev => [...prev, newItem.category]);
    }

    toast({
      title: "Item Added",
      description: `${newItem.name} has been added to your wardrobe.`,
    });
  };

  const handleUpdateItem = (updatedItem: ClothingItem) => {
    setWardrobe(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    // Update all instances of this item on the canvas
    setCanvasItems(prev => prev.map(cItem => 
      cItem.item.id === updatedItem.id ? { ...cItem, item: updatedItem } : cItem
    ));
    toast({
      title: "Item Updated",
      description: `${updatedItem.name} has been updated successfully.`,
    });
  };


  const handleAddItemToCanvas = (item: ClothingItem, position: { x: number, y: number }) => {
    const maxZIndex = Math.max(0, ...canvasItems.map(i => i.zIndex || 0));
    const newCanvasItem: CanvasItem = {
      instanceId: `${item.id}-${Date.now()}`,
      item,
      x: position.x - 100, // Center the drop on cursor
      y: position.y - 100,
      width: 200,
      height: 200,
      zIndex: maxZIndex + 1,
    };
    setCanvasItems(prev => [...prev, newCanvasItem]);
  };

  const handleRemoveItemFromCanvas = (instanceId: string) => {
    setCanvasItems(prev => prev.filter(i => i.instanceId !== instanceId));
  };
  
  const handleUpdateCanvasItem = (instanceId: string, updates: Partial<CanvasItem>) => {
    setCanvasItems(prev => prev.map(i => i.instanceId === instanceId ? { ...i, ...updates } : i));
  };
  
  const handleBringToFront = (instanceId: string) => {
    const maxZIndex = Math.max(0, ...canvasItems.map(item => item.zIndex || 0));
    setCanvasItems(prev => prev.map(item => item.instanceId === instanceId ? { ...item, zIndex: maxZIndex + 1 } : item));
  };

  const handleClearCanvas = () => {
    setCanvasItems([]);
  };

  const handleSaveOutfit = () => {
    if (canvasItems.length === 0) {
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
    // Remove from wardrobe
    setWardrobe(prev => prev.filter(item => item.id !== itemId));
    // Also remove all instances from canvas
    setCanvasItems(prev => prev.filter(cItem => cItem.item.id !== itemId));
    toast({
      title: "Item Deleted",
      description: "The item has been removed from your wardrobe and canvas.",
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
    let currentX = 50;
    let currentY = 50;
    const maxZIndex = Math.max(0, ...canvasItems.map(i => i.zIndex || 0));
    
    const newCanvasItems: CanvasItem[] = suggestedItems.map((suggestedItem, index) => {
        const wardrobeItem = wardrobe.find(item => item.name === suggestedItem.name && item.photoDataUri === suggestedItem.photoDataUri);
        if (!wardrobeItem) return null;

        const canvasItem: CanvasItem = {
            instanceId: `${wardrobeItem.id}-${Date.now()}-${index}`,
            item: wardrobeItem,
            x: currentX,
            y: currentY,
            width: 250,
            height: 250,
            zIndex: maxZIndex + index + 1
        };
        currentX += 75;
        currentY += 75;
        return canvasItem;
    }).filter((item): item is CanvasItem => item !== null);

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
          onUpdateItem={handleUpdateItem}
          onGetAiSuggestions={handleGetAiSuggestions}
          isAiLoading={isAiLoading}
          onDeleteItem={handleDeleteItem}
          categories={categories}
        />
        <OutfitCanvas
          items={canvasItems}
          onDrop={handleAddItemToCanvas}
          onRemoveItem={handleRemoveItemFromCanvas}
          onUpdateItem={handleUpdateCanvasItem}
          onBringToFront={handleBringToFront}
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
