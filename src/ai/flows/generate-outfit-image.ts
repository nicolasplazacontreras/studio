'use server';
/**
 * @fileOverview A Genkit flow for generating an image of a clothing outfit.
 *
 * - generateOutfitImage - A function that generates an outfit image from a set of clothing items.
 * - GenerateOutfitImageInput - The input type for the generateOutfitImage function.
 * - GenerateOutfitImageOutput - The return type for the generateOutfitImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOutfitImageInputSchema = z.object({
  items: z.array(z.object({
      photoDataUri: z.string().describe("Data URI of a clothing item image."),
      category: z.string().describe("The category of the item, e.g., 'Tops', 'Shoes'."),
  })).describe("The clothing items in the outfit."),
  aspectRatio: z.string().describe("The desired aspect ratio for the output image, e.g., '1:1', '4:5', '9:16'."),
});
export type GenerateOutfitImageInput = z.infer<typeof GenerateOutfitImageInputSchema>;

const GenerateOutfitImageOutputSchema = z.object({
  photoDataUri: z.string().describe("The generated outfit image as a data URI."),
});
export type GenerateOutfitImageOutput = z.infer<typeof GenerateOutfitImageOutputSchema>;


export async function generateOutfitImage(input: GenerateOutfitImageInput): Promise<GenerateOutfitImageOutput> {
  return generateOutfitImageFlow(input);
}

const generateOutfitImageFlow = ai.defineFlow(
  {
    name: 'generateOutfitImageFlow',
    inputSchema: GenerateOutfitImageInputSchema,
    outputSchema: GenerateOutfitImageOutputSchema,
  },
  async (input) => {
    const promptParts: any[] = [];
    input.items.forEach(item => {
        promptParts.push({ media: { url: item.photoDataUri } });
    });
    
    promptParts.push({ text: `Create a single, cohesive 'flat lay' image composition featuring these clothing items. Arrange them artfully on a clean, neutral, slightly textured background (like light wood or linen). The final image should look like a professional shot for a fashion blog or social media. Ensure the final image has an aspect ratio of ${input.aspectRatio}. Do not include any text, logos, or human models.` });

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('Image generation failed to return an image.');
    }

    return { photoDataUri: media.url };
  }
);
