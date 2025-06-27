'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting outfits based on user's wardrobe.
 *
 * - suggestOutfit - A function that suggests outfits based on clothing items.
 * - SuggestOutfitInput - The input type for the suggestOutfit function.
 * - SuggestOutfitOutput - The return type for the suggestOutfit function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOutfitInputSchema = z.object({
  clothingItems: z.array(
    z.object({
      name: z.string().describe('The name of the clothing item.'),
      photoDataUri: z
        .string()
        .describe(
          "A photo of the clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      category: z.string().describe('The category of the clothing item (e.g., hats, top, bottom, shoes, accessories, bags).'),
      description: z.string().optional().describe('Additional description of the clothing item.'),
    })
  ).describe('An array of clothing items in the user wardrobe.'),
});
export type SuggestOutfitInput = z.infer<typeof SuggestOutfitInputSchema>;

const SuggestOutfitOutputSchema = z.object({
  outfitSuggestions: z.array(
    z.object({
      description: z.string().describe('A description of the outfit suggestion.'),
      items: z.array(
        z.object({
          name: z.string().describe('The name of the clothing item in the outfit.'),
          photoDataUri: z.string().describe('The photo of the clothing item in the outfit.'),
          category: z.string().describe('The category of the clothing item.'),
        })
      ).describe('The clothing items included in the outfit suggestion.'),
    })
  ).describe('An array of outfit suggestions.'),
});
export type SuggestOutfitOutput = z.infer<typeof SuggestOutfitOutputSchema>;

export async function suggestOutfit(input: SuggestOutfitInput): Promise<SuggestOutfitOutput> {
  return suggestOutfitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOutfitPrompt',
  input: {schema: SuggestOutfitInputSchema},
  output: {schema: SuggestOutfitOutputSchema},
  prompt: `You are a personal stylist AI. Given a user's wardrobe, suggest 3 different outfits.

Wardrobe:
{{#each clothingItems}}
- Name: {{this.name}}
  Category: {{this.category}}
  Description: {{#if this.description}}{{this.description}}{{else}}No description provided.{{/if}}
  Photo: {{media url=this.photoDataUri}}
{{/each}}

For each outfit, provide a description and list the clothing items included, including their names, categories and photos.  Focus on outfits that are stylish and appropriate for everyday wear.
`,
});

const suggestOutfitFlow = ai.defineFlow(
  {
    name: 'suggestOutfitFlow',
    inputSchema: SuggestOutfitInputSchema,
    outputSchema: SuggestOutfitOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
