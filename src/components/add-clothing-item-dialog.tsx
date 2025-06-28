"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { ClothingItem } from '@/lib/types';

interface AddClothingItemDialogProps {
  children: React.ReactNode;
  onAddItem: (item: Omit<ClothingItem, 'id'>) => void;
  categories: string[];
}

export function AddClothingItemDialog({ children, onAddItem, categories }: AddClothingItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !photo) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields and upload a photo.",
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(photo);
    reader.onload = () => {
      onAddItem({
        name,
        category,
        photoDataUri: reader.result as string,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      setIsOpen(false);
      setName('');
      setCategory('');
      setTags('');
      setPhoto(null);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast({
        variant: "destructive",
        title: "File Read Error",
        description: "There was an error processing your photo.",
      });
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Clothing Item</DialogTitle>
          <DialogDescription>
            Upload a photo and details for your new item.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g., Classic White Tee" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
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
            <Label htmlFor="tags" className="text-right">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="casual, summer, work (comma-separated)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="photo" className="text-right">Photo</Label>
            <Input id="photo" type="file" onChange={handleFileChange} accept="image/*" className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="submit">Save Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
