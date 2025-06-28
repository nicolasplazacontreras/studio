"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const [newPhotoDataUri, setNewPhotoDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setTags(item.tags?.join(', ') || '');
      setNewPhotoDataUri(null); // Reset photo on item change
    }
  }, [item]);

  if (!item) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setNewPhotoDataUri(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "There was an error processing your photo.",
        });
      };
    }
  };

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
      photoDataUri: newPhotoDataUri || item.photoDataUri,
      // When a new photo is uploaded, it becomes the new original.
      // This also clears any previous AI edits (cutout/background removal).
      originalPhotoDataUri: newPhotoDataUri ? undefined : item.originalPhotoDataUri,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Clothing Item</DialogTitle>
          <DialogDescription>
            Update the details for your item. You can also upload a new photo to replace the current one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="flex justify-center">
                <Image 
                    src={newPhotoDataUri || item.photoDataUri} 
                    alt="Item preview" 
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover rounded-md border"
                />
            </div>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-photo" className="text-right">New Photo</Label>
            <Input id="edit-photo" type="file" onChange={handleFileChange} accept="image/*" className="col-span-3" />
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
