
import { GoogleGenAI, Type } from "@google/genai";
import { ProductCategory, Product, LocalizedText } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export interface GeneratedProductMetadata {
  name: LocalizedText;
  description: LocalizedText;
  recipe: LocalizedText;
  price: number;
  category: ProductCategory;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
}

export const generateProductMetadata = async (dishName: string): Promise<GeneratedProductMetadata> => {
  const ai = getAiClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a restaurant menu item entry for "${dishName}". 
    1. Estimate a realistic price in USD. 
    2. Estimate nutritional values. 
    3. Assign a category.
    4. Provide translations for Name and Description in English (en), Italian (it), French (fr), and German (de).
    5. List potential allergens.
    6. Provide a brief Recipe/Preparation summary in all 4 languages (e.g., "Grill patty for 4 mins, toast bun...").`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { 
            type: Type.OBJECT,
            properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
          },
          description: { 
             type: Type.OBJECT,
             properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
          },
          recipe: { 
            type: Type.OBJECT,
            properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
         },
          price: { type: Type.NUMBER },
          category: { type: Type.STRING, enum: Object.values(ProductCategory) },
          nutrition: {
            type: Type.OBJECT,
            properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fat: { type: Type.NUMBER } }
          },
          allergens: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate product metadata");
  }

  return JSON.parse(response.text) as GeneratedProductMetadata;
};

export const parseMenuFromImage = async (base64Image: string): Promise<GeneratedProductMetadata[]> => {
    const ai = getAiClient();
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            { text: "Analyze this restaurant menu image. Extract food items. Return JSON with Name/Description/Recipe (translated to en, it, fr, de), Price, Category, Nutrition estimates, and Allergens." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { 
                type: Type.OBJECT,
                properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
              },
              description: { 
                 type: Type.OBJECT,
                 properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
              },
              recipe: { 
                type: Type.OBJECT,
                properties: { en: { type: Type.STRING }, it: { type: Type.STRING }, fr: { type: Type.STRING }, de: { type: Type.STRING } }
              },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING, enum: Object.values(ProductCategory) },
              nutrition: {
                type: Type.OBJECT,
                properties: { calories: { type: Type.NUMBER }, protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fat: { type: Type.NUMBER } }
              },
              allergens: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
  
    if (!response.text) {
      throw new Error("Failed to parse menu from image");
    }
  
    return JSON.parse(response.text) as GeneratedProductMetadata[];
};

export const generateProductImage = async (dishName: string, description: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: `Professional food photography of ${dishName}. ${description}. High end restaurant plating, studio lighting, 4k, ultra detailed, appetizing, macro shot, isolated on neutral background.`,
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated by Gemini");
};
