"use client";

import { useState } from 'react';
import type { ClothingItem } from '@/lib/types';
import { AddClothingItemDialog } from './add-clothing-item-dialog';
import { EditClothingItemDialog } from './edit-clothing-item-dialog';
import { ClothingItemCard } from './clothing-item-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Search } from 'lucide-react';
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
  onUpdateItem: (item: ClothingItem) => void;
  onDeleteItem: (itemId: string) => void;
  categories: string[];
}

export default function WardrobeSidebar({ items, onAddItem, onUpdateItem, onDeleteItem, categories }: WardrobeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    const nameMatch = item.name.toLowerCase().includes(term);
    const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(term));
    return nameMatch || tagMatch;
  });
  
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const { category } = item;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ClothingItem[]>);
  
  const activeCategories = searchTerm ? Object.keys(itemsByCategory) : categories;

  return (
    <>
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
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by name or tag..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredItems.length > 0 ? (
            <Accordion type="multiple" defaultValue={activeCategories} value={activeCategories} className="w-full">
              {categories.map((category) => {
                const categoryItems = itemsByCategory[category] || [];
                if (searchTerm && categoryItems.length === 0) return null;
                
                return (
                  <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      {`${category} (${categoryItems.length})`}
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      {categoryItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          {categoryItems.map((item) => (
                            <ClothingItemCard 
                              key={item.id} 
                              item={item} 
                              onDelete={() => onDeleteItem(item.id)}
                              onEdit={() => setEditingItem(item)} 
                            />
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
              <p className="text-muted-foreground">{searchTerm ? 'No items match your filter.' : 'Your wardrobe is empty.'}</p>
              <p className="text-sm text-muted-foreground">{searchTerm ? 'Try a different search term.' : 'Add items to get started!'}</p>
            </div>
          )}
        </ScrollArea>
      </aside>
      <EditClothingItemDialog
        isOpen={!!editingItem}
        onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
        item={editingItem}
        onUpdateItem={onUpdateItem}
        categories={categories}
      />
    </>
  );
}
