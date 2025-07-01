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

interface SaveOutfitDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (name: string) => void;
}

export function SaveOutfitDialog({ isOpen, onOpenChange, onSave }: SaveOutfitDialogProps) {
    const [name, setName] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            setName('');
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
        onSave(name);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Your Outfit</DialogTitle>
                    <DialogDescription>
                        Give your new outfit a memorable name.
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
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSaveClick}>Save Outfit</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
