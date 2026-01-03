
import { GoogleGenAI } from "@google/genai";
import { CalculationRecord, BusinessProfile } from "../types";

/**
 * Fetches AI-driven financial insights using Gemini.
 * Implements basic error handling for production stability.
 */
export const getFinancialInsights = async (
  records: CalculationRecord[],
  profile: BusinessProfile
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment variables.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format the last 10 records for better context
  const historySummary = records.slice(0, 10).map(r => 
    `- ${r.productName}: ${r.margin.toFixed(1)}% margin, ${profile.currency}${r.totalProfit.toFixed(2)} total profit`
  ).join('\n');

  const prompt = `
    Context: You are a senior business strategist for a company in the ${profile.industry} sector.
    
    Data History (Recent Calculations):
    ${historySummary}
    
    Task: Analyze these metrics and provide exactly 3 actionable strategies.
    Format: 
    1. [Strategy Title]: [Description]
    2. [Strategy Title]: [Description]
    3. [Strategy Title]: [Description]
    
    Guidelines: Focus on increasing the Average Margin (currently around ${(records.reduce((a,b)=>a+b.margin,0)/records.length).toFixed(1)}%). 
    Keep it professional, data-driven, and brief.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 500
      }
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    
    if (error.status === 429) {
      return "The AI Advisor is receiving too many requests. Please wait a moment and try again.";
    }
    
    return "Our financial engine is currently being updated. Please try again in a few minutes.";
  }
};
