"use client";

import type { ClothingItem } from '@/lib/types';
import { AddClothingItemDialog } from './add-clothing-item-dialog';
import { ClothingItemCard } from './clothing-item-card';
import { Button } from './ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface WardrobeSidebarProps {
  items: ClothingItem[];
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  onGetAiSuggestions: () => void;
  isAiLoading: boolean;
  onDeleteItem: (itemId: string) => void;
  categories: string[];
}

export default function WardrobeSidebar({ items, onAddItem, onGetAiSuggestions, isAiLoading, onDeleteItem, categories }: WardrobeSidebarProps) {
  const itemsByCategory = items.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ClothingItem[]>);

  return (
    <aside className="flex w-full max-w-xs flex-col border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">My Wardrobe</h2>
        <AddClothingItemDialog onAddItem={onAddItem} categories={categories}>
          <Button size="sm" variant="ghost">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </AddClothingItemDialog>
      </div>
      <ScrollArea className="flex-1">
        {items.length > 0 ? (
          <Accordion type="multiple" defaultValue={categories} className="w-full">
            {categories.map((category) => {
              const categoryItems = itemsByCategory[category] || [];
              return (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    {`${category} (${categoryItems.length})`}
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    {categoryItems.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {categoryItems.map((item) => (
                          <ClothingItemCard key={item.id} item={item} onDelete={() => onDeleteItem(item.id)} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No items in this category.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground">Your wardrobe is empty.</p>
            <p className="text-sm text-muted-foreground">Add items to get started!</p>
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <Button className="w-full" onClick={onGetAiSuggestions} disabled={isAiLoading}>
          <Sparkles className={`mr-2 h-4 w-4 ${isAiLoading ? 'animate-spin' : ''}`} />
          {isAiLoading ? 'Thinking...' : 'Suggest Outfits with AI'}
        </Button>
      </div>
    </aside>
  );
}
