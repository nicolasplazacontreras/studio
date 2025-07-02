'use server';

import { z } from 'zod';

const UrlSchema = z.string().url({ message: "Invalid URL provided." });

export async function convertUrlToDataUri(url: string): Promise<string> {
  const validation = UrlSchema.safeParse(url);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image. Status: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('The provided URL does not point to a valid image file.');
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error: any) {
    console.error('Error converting URL to data URI:', error);
    // Rethrow a more user-friendly message
    if (error.message.includes('fetch')) {
         throw new Error('Could not fetch the image. Please check the URL and try again.');
    }
    throw error;
  }
}
