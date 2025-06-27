export interface ClothingItem {
  id: string;
  name: string;
  category: 'Tops' | 'Bottoms' | 'Shoes' | 'Accessories';
  photoDataUri: string;
  "data-ai-hint"?: string;
}

export type CanvasItems = {
  Tops?: ClothingItem;
  Bottoms?: ClothingItem;
  Shoes?: ClothingItem;
  Accessories?: ClothingItem;
};

export interface Outfit {
  id: string;
  items: CanvasItems;
}
