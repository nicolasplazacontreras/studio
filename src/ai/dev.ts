import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-outfit.ts';
import '@/ai/flows/generate-outfit-image.ts';
import '@/ai/flows/remove-background.ts';
import '@/ai/flows/create-cutout.ts';
import '@/ai/flows/refine-mask.ts';
