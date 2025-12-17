import { GoogleGenAI } from "@google/genai";

// AI 功能
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNoteEnhancement = async (content: string): Promise<string> => {
  if (!content.trim()) {
    return content;
  }
  try {
    // Per guidelines, use generateContent for text answers
    const response = await ai.models.generateContent({
      // Per guidelines, 'gemini-2.5-flash' for basic text tasks
      model: 'gemini-2.5-flash',
      contents: `Please refine and enhance the following note for better clarity, structure, and conciseness, while preserving the core ideas. Note:\n\n"${content}"`,
    });
    // Per guidelines, use response.text to get string output
    return response.text?.trim() || content; // Return original content on failure
  } catch (error) {
    console.error('Error enhancing note with Gemini:', error);
    // Return original content on error
    return content;
  }
};

export const generateTagsForNote = async () => { return []; };
