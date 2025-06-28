"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { ClothingItem } from '@/lib/types';

interface EditClothingItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: ClothingItem | null;
  onUpdateItem: (item: ClothingItem) => void;
  categories: string[];
}

export function EditClothingItemDialog({ isOpen, onOpenChange, item, onUpdateItem, categories }: EditClothingItemDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setTags(item.tags?.join(', ') || '');
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out name and category.",
      });
      return;
    }

    onUpdateItem({
      ...item,
      name,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Clothing Item</DialogTitle>
          <DialogDescription>
            Update the details for your item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g., Classic White Tee" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-category" className="text-right">Category</Label>
            <Select onValueChange={(value) => setCategory(value)} value={category}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-tags" className="text-right">Tags</Label>
            <Input id="edit-tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="casual, summer, work (comma-separated)" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
