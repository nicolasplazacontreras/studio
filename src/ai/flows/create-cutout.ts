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
  maskDataUri: z.string().describe("A black and white mask for the cutout, as a data URI."),
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
        { text: `Analyze the image and identify the main subject. Create a black and white mask. The mask must represent the subject with a thick, irregular white border around it, as if cut with scissors. The subject and its border must be solid white, and everything else must be solid black. The output MUST be a PNG file.` }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('Image generation failed to return an image.');
    }

    return { maskDataUri: media.url };
  }
);
