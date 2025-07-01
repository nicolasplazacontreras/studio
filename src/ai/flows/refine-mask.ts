'use server';
/**
 * @fileOverview A Genkit flow for refining a mask by eliminating details within the subject.
 *
 * - refineMask - A function that fills in details within a mask's subject.
 * - RefineMaskInput - The input type for the refineMask function.
 * - RefineMaskOutput - The return type for the refineMask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineMaskInputSchema = z.object({
  maskDataUri: z.string().describe("A black and white mask image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type RefineMaskInput = z.infer<typeof RefineMaskInputSchema>;

const RefineMaskOutputSchema = z.object({
  refinedMaskDataUri: z.string().describe("The refined black and white mask, as a data URI."),
});
export type RefineMaskOutput = z.infer<typeof RefineMaskOutputSchema>;

export async function refineMask(input: RefineMaskInput): Promise<RefineMaskOutput> {
  return refineMaskFlow(input);
}

const refineMaskFlow = ai.defineFlow(
  {
    name: 'refineMaskFlow',
    inputSchema: RefineMaskInputSchema,
    outputSchema: RefineMaskOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.maskDataUri } },
        { text: `You are an expert image processor. You will be given a black and white mask image. Your task is to identify the main white subject(s) in the image. Within the external contour of this white subject, you must fill any black areas or 'holes' with pure solid white (#FFFFFF). The goal is to make the entire subject a solid white silhouette, with no internal details. The background must remain pure solid black (#000000). The output MUST be a PNG file.` }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media) {
      throw new Error('Image generation failed to return an image.');
    }

    return { refinedMaskDataUri: media.url };
  }
);
