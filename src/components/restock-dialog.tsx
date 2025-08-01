
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from 'lucide-react';

interface RestockPillsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestock: (quantity: number) => Promise<boolean>;
}

export function RestockPillsDialog({ isOpen, onClose, onRestock }: RestockPillsDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleRestock = async () => {
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Please enter a valid positive number.');
      return;
    }
    setError('');

    startTransition(async () => {
      const success = await onRestock(numQuantity);
      if (success) {
        setQuantity('');
        onClose();
      }
    });
  };

  const handleClose = () => {
    if (isPending) return;
    setQuantity('');
    setError('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock Pills</DialogTitle>
          <DialogDescription>
            Enter the number of pills you are adding. This will reset the current inventory count and clear previous dispense events.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Pill Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 30"
              min="1"
            />
          </div>
          {error && <p className="text-sm text-red-500 col-span-4 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleRestock} disabled={isPending}>
            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Restock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
