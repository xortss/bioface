/**
 * Sends an image to the backend to generate an avatar in a single step.
 * @param base64Data The base64-encoded image data, without the data URL prefix.
 * @param mimeType The MIME type of the image (e.g., 'image/png').
 * @param style An optional string describing the creative style for the avatar.
 * @returns A base64-encoded string of the generated JPEG image.
 */
export async function generateAvatar(base64Data: string, mimeType: string, style: string | null): Promise<string> {
  const response = await fetch('/api/generate-avatar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Data, mimeType: mimeType, style: style }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate avatar: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  return data.avatar;
}

/**
 * Fetches creative style suggestions for an image from the backend.
 * @param base64Data The base64-encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns A promise that resolves to an array of string suggestions.
 */
export async function getSuggestions(base64Data: string, mimeType: string): Promise<string[]> {
    const response = await fetch('/api/suggest-styles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Data, mimeType: mimeType }),
    });
  
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get suggestions: ${errorText || response.statusText}`);
    }
  
    const data = await response.json();
    return data.suggestions;
  }