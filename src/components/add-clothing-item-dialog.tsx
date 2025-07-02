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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import type { ClothingItem } from '@/lib/types';
import { convertUrlToDataUri } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setTags('');
    setPhoto(null);
    setImageUrl('');
    setUploadMethod('file');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out the name and category.",
      });
      return;
    }

    setIsSubmitting(true);

    let photoDataUri: string | null = null;

    try {
      if (uploadMethod === 'file') {
        if (!photo) {
          throw new Error("Please select a file to upload.");
        }
        photoDataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(photo);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(new Error("There was an error processing your photo."));
        });
      } else { // uploadMethod === 'url'
        if (!imageUrl) {
          throw new Error("Please enter an image URL.");
        }
        photoDataUri = await convertUrlToDataUri(imageUrl);
      }

      onAddItem({
        name,
        category,
        photoDataUri,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });

      setIsOpen(false);
      resetForm();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Image Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Clothing Item</DialogTitle>
          <DialogDescription>
            Fill in the details for your new item. You can upload a photo or provide a link.
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
          
          <div className="grid grid-cols-4 items-start gap-4 pt-2">
            <Label className="text-right pt-3">Photo</Label>
            <div className="col-span-3">
              <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="url">From URL</TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="pt-2">
                  <Input id="photo" type="file" onChange={handleFileChange} accept="image/*" />
                </TabsContent>
                <TabsContent value="url" className="pt-2">
                  <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.png" />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
