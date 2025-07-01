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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Outfit } from '@/lib/types';

interface SaveOutfitDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (details: { name: string; id?: string }) => void;
    existingOutfits: Outfit[];
}

export function SaveOutfitDialog({ isOpen, onOpenChange, onSave, existingOutfits }: SaveOutfitDialogProps) {
    const [name, setName] = useState('');
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setSelectedId(undefined);
        }
    }, [isOpen]);

    const handleSaveClick = () => {
        if (!name.trim()) {
            toast({
                variant: "destructive",
                title: "Outfit name is required",
                description: "Please enter a name for your outfit before saving.",
            });
            return;
        }
        onSave({ name, id: selectedId });
        onOpenChange(false);
    };

    const handleSelectChange = (outfitId: string) => {
        if (outfitId === 'new') {
            setSelectedId(undefined);
            setName('');
        } else {
            const selectedOutfit = existingOutfits.find(o => o.id === outfitId);
            if (selectedOutfit) {
                setSelectedId(selectedOutfit.id);
                setName(selectedOutfit.name);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Your Outfit</DialogTitle>
                    <DialogDescription>
                        Give your outfit a name or choose an existing one to overwrite.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="outfit-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="outfit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Summer Casual Vibes"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveClick();
                                }
                            }}
                        />
                    </div>
                    {existingOutfits.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="overwrite-outfit" className="text-right">
                                Overwrite
                            </Label>
                            <Select onValueChange={handleSelectChange} value={selectedId || 'new'}>
                                <SelectTrigger id="overwrite-outfit" className="col-span-3">
                                    <SelectValue placeholder="Save as new outfit..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Save as new outfit</SelectItem>
                                    {existingOutfits.map(outfit => (
                                        <SelectItem key={outfit.id} value={outfit.id}>{outfit.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSaveClick}>
                        {selectedId ? 'Overwrite Outfit' : 'Save New Outfit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
