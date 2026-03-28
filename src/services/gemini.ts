import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface WordAnalysis {
  word: string;
  isValid: boolean;
  tier: 1 | 2 | 3; // 1: Common, 2: Poetic, 3: Linguist
  explanation: string;
  field?: string;
  upgrade?: string;
}

export async function analyzeWord(word: string, letter: string, field?: string): Promise<WordAnalysis> {
  const prompt = `Analyze the word "${word}" for a vocabulary game.
  Rules:
  1. Must start with the letter "${letter}".
  2. If a field is provided ("${field || 'none'}"), check if it fits.
  3. Categorize into tiers:
     - Tier 1 (Common): Simple, everyday words.
     - Tier 2 (Poetic): Descriptive, sophisticated adjectives/verbs.
     - Tier 3 (Linguist): Formal, academic, or industry-specific terms.
  
  Return JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            isValid: { type: Type.BOOLEAN },
            tier: { type: Type.INTEGER, description: "1, 2, or 3" },
            explanation: { type: Type.STRING },
            field: { type: Type.STRING },
            upgrade: { type: Type.STRING, description: "A more sophisticated version of this word" }
          },
          required: ["word", "isValid", "tier", "explanation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      word,
      isValid: word.toLowerCase().startsWith(letter.toLowerCase()),
      tier: 1,
      explanation: "Fallback validation due to API error."
    };
  }
}
