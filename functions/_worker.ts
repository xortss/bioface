import { GoogleGenAI, Type } from "@google/genai";

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  API_KEY: string;
}

interface ApiRequest {
  image: string;
  mimeType: string;
  style?: string | null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/generate-avatar') {
            return handleAvatarGeneration(request, env);
        }
        if (url.pathname === '/api/suggest-styles') {
            return handleStyleSuggestion(request, env);
        }
        return new Response("API route not found", { status: 404 });
    }

    // For all other requests, serve the static assets from the build output.
    return env.ASSETS.fetch(request);
  },
};

async function handleAvatarGeneration(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.API_KEY });
    const { image, mimeType, style } = await request.json() as ApiRequest;
    if (!image || !mimeType) {
      return new Response('Missing image or mimeType data in request body', { status: 400 });
    }

    let description;
    try {
        description = await getFastDescription(ai, image, mimeType);
        console.log('Successfully generated description:', description);
    } catch(e) {
        console.error('Error in getFastDescription:', e);
        throw new Error('Failed to generate description from image.');
    }

    let isValid;
    try {
        isValid = await validateDescriptionIsPerson(ai, description);
        console.log('Successfully validated description. Is person?', isValid);
    } catch(e) {
        console.error('Error in validateDescriptionIsPerson:', e);
        throw new Error('Failed to validate image description.');
    }

    if (!isValid) {
      return new Response('No person detected in the image. Please upload a clear photo of a face.', { status: 400 });
    }

    let avatar;
    try {
        avatar = await generateAvatarFromDescription(ai, description, style);
        console.log('Successfully generated avatar.');
    } catch(e) {
        console.error('Error in generateAvatarFromDescription:', e);
        throw new Error('Failed to generate the final avatar image.');
    }

    return new Response(JSON.stringify({ avatar }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error in /api/generate-avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
    return new Response(errorMessage, { status: 500 });
  }
}

async function handleStyleSuggestion(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
  
    try {
      const ai = new GoogleGenAI({ apiKey: env.API_KEY });
      const { image, mimeType } = await request.json() as ApiRequest;
      if (!image || !mimeType) {
        return new Response('Missing image or mimeType data', { status: 400 });
      }

      const suggestions = await getCreativeStyles(ai, image, mimeType);
  
      return new Response(JSON.stringify({ suggestions }), {
        headers: { 'Content-Type': 'application/json' },
      });
  
    } catch (error) {
      console.error('API Error in /api/suggest-styles:', error);
      const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred';
      return new Response(errorMessage, { status: 500 });
    }
}

async function getFastDescription(ai: GoogleGenAI, base64Data: string, mimeType: string): Promise<string> {
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const textPart = { text: "VERY briefly describe the subject in this image using only a few comma-separated keywords. Focus on key features. Example: 'woman, long brown hair, brown eyes, smiling, glasses' or 'tabby cat, sitting on a couch'." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    
    const text = response.text;
    if (!text) {
        throw new Error('Model failed to generate a description.');
    }
    return text.trim();
}

async function validateDescriptionIsPerson(ai: GoogleGenAI, description: string): Promise<boolean> {
  const prompt = `Does the following description refer to a person or human? Answer with only "yes" or "no". Description: "${description}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: prompt,
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });

  const answer = response.text?.toLowerCase().trim();
  return answer === 'yes';
}

async function generateAvatarFromDescription(ai: GoogleGenAI, description: string, style?: string | null): Promise<string> {
    const basePrompt = "Photorealistic headshot, detailed, professional lighting, soft-focus background.";
    const stylePrompt = style 
        ? `Creative style: '${style}'.` 
        : "Style: Corporate linkedin, friendly but confident expression.";

    const prompt = `${basePrompt} ${stylePrompt} Use these features from the original photo: ${description}`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
    });
    
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    
    if (!imageBytes) {
      throw new Error('Image generation failed to return image data.');
    }

    return imageBytes;
}

async function getCreativeStyles(ai: GoogleGenAI, base64Data: string, mimeType: string): Promise<string[]> {
    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const textPart = { text: "Based on the person in this image, suggest 3-4 creative, one-or-two-word avatar styles or personas. Examples: 'Galactic Explorer', 'Steampunk Inventor', 'Forest Mage', 'Cyberpunk Hacker', 'Film Noir Detective', 'Pop Art Portrait'. Return ONLY a JSON array of strings." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
             type: Type.ARRAY,
             items: {
               type: Type.STRING,
               description: "A creative style or persona",
             },
           },
        }
    });

    try {
        const jsonText = response.text;
        if (!jsonText) {
          console.error("Model returned no text for suggestions.");
          return [];
        }
        
        const parsed = JSON.parse(jsonText.trim());
        if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string');
        }
        return [];
    } catch(e) {
        console.error("Failed to parse suggestions from model:", e);
        return [];
    }
}