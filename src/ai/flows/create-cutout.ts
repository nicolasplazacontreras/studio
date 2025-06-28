'use server';
/**
 * @fileOverview A Genkit flow for creating a magazine-style cutout image of a clothing item.
 *
 * - createCutout - A function that creates a cutout image from an original photo.
 * - CreateCutoutInput - The input type for the createCutout function.
 * - CreateCutoutOutput - The return type for the createCutout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateCutoutInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of an item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type CreateCutoutInput = z.infer<typeof CreateCutoutInputSchema>;

const CreateCutoutOutputSchema = z.object({
  photoDataUri: z.string().describe("The processed cutout image with a white border and transparent background, as a data URI."),
});
export type CreateCutoutOutput = z.infer<typeof CreateCutoutOutputSchema>;

export async function createCutout(input: CreateCutoutInput): Promise<CreateCutoutOutput> {
  return createCutoutFlow(input);
}

const createCutoutFlow = ai.defineFlow(
  {
    name: 'createCutoutFlow',
    inputSchema: CreateCutoutInputSchema,
    outputSchema: CreateCutoutOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `
          Analyze the image and identify the primary clothing object.
          Your task is to create a magazine-style cutout of this object.
          1. Segment the object perfectly from its background.
          2. Add a thick, irregular white border around the segmented object to simulate a scissor-cut effect.
          3. Generate a new image containing ONLY the bordered object.
          4. The area outside the white border MUST be 100% transparent.
          5. The final output MUST be a PNG data URI with a valid alpha channel for transparency.
          Do not add any solid background color outside the white border. It must be transparent.
        ` }
      ],
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
