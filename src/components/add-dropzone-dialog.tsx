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
import { useToast } from '@/hooks/use-toast';

interface AddDropZoneDialogProps {
  children: React.ReactNode;
  onAddZone: (categoryName: string) => void;
}

export function AddDropZoneDialog({ children, onAddZone }: AddDropZoneDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Category Name",
        description: "Please enter a name for the new drop zone.",
      });
      return;
    }
    onAddZone(name);
    setIsOpen(false);
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Drop Zone</DialogTitle>
          <DialogDescription>
            Create a new category for your outfit canvas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="col-span-3" 
              placeholder="e.g., Jewelry" 
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add Drop Zone</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
