export interface ClothingItem {
  id: string;
  name: string;
  category: 'Hats' | 'Tops' | 'Bottoms' | 'Shoes' | 'Accessories' | 'Bags';
  photoDataUri: string;
  "data-ai-hint"?: string;
}

export type CanvasItems = {
  Hats?: ClothingItem;
  Tops?: ClothingItem;
  Bottoms?: ClothingItem;
  Shoes?: ClothingItem;
  Accessories?: ClothingItem;
  Bags?: ClothingItem;
};

export interface Outfit {
  id: string;
  items: CanvasItems;
}
