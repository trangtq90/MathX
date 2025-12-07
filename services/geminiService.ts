import { GoogleGenAI, Type } from "@google/genai";
import { Grade, Question } from '../types';

export const generateMathQuestions = async (grade: Grade, topic: string, count: number, difficulty: string): Promise<Question[]> => {
  // Use process.env.API_KEY directly as per guidelines. 
  // Assume it is valid and pre-configured.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Generate ${count} ${difficulty} level multiple choice math questions for Grade ${grade} students about "${topic}". 
  Format the output as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: "The question text, use LaTeX for math symbols if needed." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 possible answers" },
              correctAnswer: { type: Type.STRING, description: "The correct answer from options" }
            },
            required: ["content", "options", "correctAnswer"]
          }
        }
      }
    });

    const rawData = response.text;
    if(!rawData) throw new Error("No data returned");

    const parsed = JSON.parse(rawData);
    
    return parsed.map((item: any, idx: number) => ({
        id: `gen_${Date.now()}_${idx}`,
        content: item.content,
        options: item.options,
        correctAnswer: item.correctAnswer,
        type: 'MCQ'
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};