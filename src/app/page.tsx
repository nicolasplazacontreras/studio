"use client"

import { useState, useEffect } from 'react';
import { type ClothingItem, type Outfit, type CanvasItem } from '@/lib/types';
import WardrobeSidebar from '@/components/wardrobe-sidebar';
import OutfitCanvas from '@/components/outfit-canvas';
import Header from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { SaveOutfitDialog } from '@/components/save-outfit-dialog';

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
  { id: '10', name: 'Plaid Scarf', category: 'Other', photoDataUri: 'https://placehold.co/400x400.png', tags: ['winter', 'cozy'], "data-ai-hint": "plaid scarf" },
];

const initialCategories = ['Hats', 'Tops', 'Bottoms', 'Shoes', 'Accessories', 'Bags', 'Other'];

export default function Home() {
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Load data from localStorage
    try {
      const savedWardrobe = localStorage.getItem('wrdrobe_wardrobe');
      setWardrobe(savedWardrobe ? JSON.parse(savedWardrobe) : initialWardrobe);
      
      const savedCategoriesJSON = localStorage.getItem('wrdrobe_categories');
      const savedCategories = savedCategoriesJSON ? JSON.parse(savedCategoriesJSON) : [];
      // This ensures all initial categories are present, even if not in localStorage.
      const allCategories = [...new Set([...initialCategories, ...savedCategories])];
      setCategories(allCategories);

      const outfitsFromStorage = localStorage.getItem('wrdrobe_outfits');
      setSavedOutfits(outfitsFromStorage ? JSON.parse(outfitsFromStorage) : []);
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setWardrobe(initialWardrobe);
      setCategories(initialCategories);
      setSavedOutfits([]);
    }
  }, []);

  useEffect(() => {
    // Save wardrobe to localStorage whenever it changes
    if(wardrobe.length > 0) localStorage.setItem('wrdrobe_wardrobe', JSON.stringify(wardrobe));
  }, [wardrobe]);

  useEffect(() => {
    if(categories.length > 0) localStorage.setItem('wrdrobe_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    const handleStorageChange = () => {
      const outfitsFromStorage = localStorage.getItem('wrdrobe_outfits');
      setSavedOutfits(outfitsFromStorage ? JSON.parse(outfitsFromStorage) : []);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);


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

  const handleSaveClick = () => {
    if (canvasItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Outfit",
        description: "Add some items to the canvas before saving.",
      });
      return;
    }
    setIsSaveDialogOpen(true);
  };
  
  const handleConfirmSave = (saveDetails: { name: string, id?: string }) => {
    let currentOutfits: Outfit[] = JSON.parse(localStorage.getItem('wrdrobe_outfits') || '[]');
    let toastTitle = "Outfit Saved!";
    let toastDescription = `"${saveDetails.name}" has been saved to your gallery.`;

    if (saveDetails.id) {
        currentOutfits = currentOutfits.map(outfit => 
            outfit.id === saveDetails.id 
                ? { id: saveDetails.id, name: saveDetails.name, items: canvasItems } 
                : outfit
        );
        toastTitle = "Outfit Overwritten!";
        toastDescription = `"${saveDetails.name}" has been updated.`;
    } else {
        const newOutfit: Outfit = { id: Date.now().toString(), name: saveDetails.name, items: canvasItems };
        currentOutfits = [newOutfit, ...currentOutfits];
    }
    
    const newOutfitsString = JSON.stringify(currentOutfits);
    localStorage.setItem('wrdrobe_outfits', newOutfitsString);
    setSavedOutfits(currentOutfits);

    toast({
      title: toastTitle,
      description: toastDescription,
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

  const handleLoadOutfit = (items: CanvasItem[]) => {
    setCanvasItems(items);
    toast({
      title: "Outfit Loaded",
      description: "The outfit has been loaded onto the canvas.",
    });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <Header onLoadOutfit={handleLoadOutfit} />
      <main className="flex flex-1 overflow-hidden">
        <WardrobeSidebar
          items={wardrobe}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          categories={categories}
        />
        <OutfitCanvas
          items={canvasItems}
          setItems={setCanvasItems}
          onSaveClick={handleSaveClick}
          onItemUpdate={handleUpdateItem}
        />
      </main>
      <SaveOutfitDialog 
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleConfirmSave}
        existingOutfits={savedOutfits}
      />
    </div>
  );
}
