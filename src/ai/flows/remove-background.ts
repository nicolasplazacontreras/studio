'use server';
/**
 * @fileOverview A Genkit flow for creating a magazine-style cutout image of a clothing item.
 *
 * - removeBackground - A function that creates a cutout image from an original photo.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RemoveBackgroundInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of an item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  photoDataUri: z.string().describe("The processed cutout image with a white border and transparent background, as a data URI."),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `You are an expert digital artist creating assets for a fashion collage. Given this image of a clothing item, create a new image that looks like a "cutout" from a fashion magazine.
First, perfectly isolate the clothing item from its background.
Then, give the isolated item a slightly irregular, thick white border, making it look as if it were carefully cut out with scissors.
The final output must be a PNG image with a fully transparent background outside of the white border. Do not alter the clothing item itself.` }
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
