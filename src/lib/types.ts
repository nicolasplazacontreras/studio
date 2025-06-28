export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  photoDataUri: string;
  originalPhotoDataUri?: string;
  tags?: string[];
  "data-ai-hint"?: string;
}

// A clothing item placed on the canvas
export interface CanvasItem {
  instanceId: string; // Unique ID for this specific instance on the canvas
  item: ClothingItem; // The original clothing item data
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface Outfit {
  id: string;
  items: CanvasItem[]; // An outfit is a collection of items on the canvas
}
