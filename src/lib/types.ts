export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  photoDataUri: string;
  "data-ai-hint"?: string;
}

export type CanvasItems = {
  [category: string]: ClothingItem | undefined;
};

export interface Outfit {
  id: string;
  items: CanvasItems;
}

export interface LayoutItem {
    id: string;
    category: string;
    row: number;
    col: number;
}
