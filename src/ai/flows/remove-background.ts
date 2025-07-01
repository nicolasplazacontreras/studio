'use server';
/**
 * @fileOverview A Genkit flow for removing the background from a clothing item image by creating a mask.
 *
 * - removeBackground - A function that creates a mask for an image.
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
  maskDataUri: z.string().describe("A black and white mask of the subject, as a data URI."),
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
        { text: `Your task is to create a precise segmentation mask. Follow these steps exactly:
1. Analyze the image to identify the main subject, separating it from the background.
2. Create a new image where the entire background is filled with pure solid white (#FFFFFF).
3. Fill the entire area of the main subject with pure solid black (#000000). Ensure there are no details or gradients within the subject's area; it must be a solid black silhouette.
4. Invert the colors of the image you just created. The final result must be an image where the subject is pure solid white (#FFFFFF) and the background is pure solid black (#000000).
The output MUST be a PNG file.` }
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
