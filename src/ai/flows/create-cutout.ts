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
          Your task is to act as an image processing service creating a magazine-style cutout.
          1.  Identify the primary clothing object in the provided image.
          2.  Create a precise segmentation mask for that object.
          3.  Add a thick, irregular, solid white border around the segmentation mask to simulate a scissor-cut effect.
          4.  Generate a new image containing ONLY the object and its white border.
          5.  The output format MUST be a PNG image with a true alpha channel (RGBA).
          6.  Every pixel that is NOT part of the bordered object must have an alpha value of 0, making it fully transparent.
          7.  Do not add any colored background (black, white, or otherwise) outside the white border. The area outside the border MUST be transparent.
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
