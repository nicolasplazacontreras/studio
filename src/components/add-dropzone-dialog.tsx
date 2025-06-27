"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface AddDropZoneDialogProps {
  children: React.ReactNode;
  onAddZone: (categoryName: string) => void;
  allCategories: string[];
  currentCategoriesOnCanvas: string[];
}

export function AddDropZoneDialog({ children, onAddZone, allCategories, currentCategoriesOnCanvas }: AddDropZoneDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const { toast } = useToast();

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName) {
      toast({
        variant: "destructive",
        title: "Missing Category Name",
        description: "Please enter a name for the new drop zone.",
      });
      return;
    }
    if (allCategories.includes(customName)) {
        toast({
            variant: "destructive",
            title: "Category Already Exists",
            description: "A category with this name already exists. Try adding it from the list above.",
          });
        return;
    }
    onAddZone(customName);
    setIsOpen(false);
    setCustomName('');
  };

  const handlePredefinedClick = (category: string) => {
    onAddZone(category);
    setIsOpen(false);
  }

  const availableCategories = allCategories.filter(cat => !currentCategoriesOnCanvas.includes(cat));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Drop Zone</DialogTitle>
          <DialogDescription>
            Add a category from your list, or create a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {availableCategories.length > 0 && (
              <div className="space-y-2">
                  <Label>Add an existing category</Label>
                  <div className="flex flex-wrap gap-2">
                      {availableCategories.map(cat => (
                          <Button key={cat} variant="outline" size="sm" onClick={() => handlePredefinedClick(cat)}>{cat}</Button>
                      ))}
                  </div>
              </div>
          )}

          {availableCategories.length > 0 && <Separator />}

          <form onSubmit={handleCustomSubmit} className="space-y-2">
              <Label htmlFor="custom-name">Create a new category</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="custom-name" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)} 
                  placeholder="e.g., Jewelry" 
                />
                <Button type="submit">Create</Button>
              </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
