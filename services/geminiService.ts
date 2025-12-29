
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ProductCategoryEnum, Product, LocalizedText } from "../types";

const getAiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local");
  }
  // Using v1 API version for stability across different key types
  return new GoogleGenerativeAI(apiKey);
};

export interface GeneratedProductMetadata {
  name: LocalizedText;
  description: LocalizedText;
  recipe: LocalizedText;
  price: number;
  category: ProductCategoryEnum;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  ingredients: string[];
  pairings: {
    drinks: string[];
    foods: string[];
  };
}

export const generateProductMetadata = async (dishName: string): Promise<GeneratedProductMetadata> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.OBJECT,
            properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
          },
          description: {
            type: SchemaType.OBJECT,
            properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
          },
          recipe: {
            type: SchemaType.OBJECT,
            properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
          },
          price: { type: SchemaType.NUMBER },
          category: { type: SchemaType.STRING, enum: Object.values(ProductCategoryEnum) } as any,
          nutrition: {
            type: SchemaType.OBJECT,
            properties: { calories: { type: SchemaType.NUMBER }, protein: { type: SchemaType.NUMBER }, carbs: { type: SchemaType.NUMBER }, fat: { type: SchemaType.NUMBER } }
          },
          allergens: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          pairings: {
            type: SchemaType.OBJECT,
            properties: {
              drinks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              foods: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
          }
        }
      } as any
    }
  });

  const prompt = `Create a restaurant menu item entry for "${dishName}". 
    1. Estimate a realistic price in USD. 
    2. Estimate nutritional values (calories, protein, carbs, fat).
    3. Assign a category (Appetizer, Main Course, Dessert, Drink, or Special).
    4. Provide translations for Name, Description, and Recipe in English (en), Italian (it), French (fr), and German (de).
    5. List ALL potential allergens (e.g., gluten, dairy, nuts, shellfish, eggs, soy).
    6. List ALL main ingredients used in this dish.
    7. Suggest 2-3 drink pairings that complement this dish (e.g., wines, cocktails, non-alcoholic).
    8. Suggest 2-3 food pairings that go well with this dish (appetizers, sides, desserts).`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Failed to generate product metadata");
  }

  return JSON.parse(text) as GeneratedProductMetadata;
};

export const parseMenuFromImage = async (base64Image: string): Promise<GeneratedProductMetadata[]> => {
  const genAI = getAiClient();
  const base64Data = base64Image.split(',')[1] || base64Image;
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.OBJECT,
              properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
            },
            description: {
              type: SchemaType.OBJECT,
              properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
            },
            recipe: {
              type: SchemaType.OBJECT,
              properties: { en: { type: SchemaType.STRING }, it: { type: SchemaType.STRING }, fr: { type: SchemaType.STRING }, de: { type: SchemaType.STRING } }
            },
            price: { type: SchemaType.NUMBER },
            category: { type: SchemaType.STRING, enum: Object.values(ProductCategoryEnum) } as any,
            nutrition: {
              type: SchemaType.OBJECT,
              properties: { calories: { type: SchemaType.NUMBER }, protein: { type: SchemaType.NUMBER }, carbs: { type: SchemaType.NUMBER }, fat: { type: SchemaType.NUMBER } }
            },
            allergens: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            pairings: {
              type: SchemaType.OBJECT,
              properties: {
                drinks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                foods: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              }
            }
          }
        }
      } as any
    }
  });

  const prompt = `Analyze this restaurant menu image. Extract ALL food items visible.
For each item, provide:
- Name, Description, and Recipe translated to English (en), Italian (it), French (fr), and German (de)
- Estimated Price in USD
- Category (Appetizer, Main Course, Dessert, Drink, or Special)
- Estimated Nutrition (calories, protein, carbs, fat)
- ALL potential Allergens
- Main Ingredients list
- Suggested drink pairings (2-3)
- Suggested food pairings (2-3)`;

  const result = await model.generateContent([
    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
    { text: prompt }
  ]);
  const response = await result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Failed to parse menu from image");
  }

  return JSON.parse(text) as GeneratedProductMetadata[];
};

export const generateProductImage = async (dishName: string, description: string): Promise<string> => {
  // Image generation is not directly available in gemini-1.5-flash via generateContent in the same way.
  // Imagen (image generation) is usually a separate model or endpoint.
  // Returning a placeholder for now to prevent the UI from breaking.
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000";
};
