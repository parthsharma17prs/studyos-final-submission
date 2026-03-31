import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { format, summaryData } = await req.json();

    if (!format || !summaryData) {
      return NextResponse.json({ error: 'Format and Summary Data are required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    let promptText = "";

    if (format === 'image') {
      promptText = `You are a visual learning architect. Analyze the provided study summary and generate specific simple drawing prompts to help students visualize the concepts. Keep it very short and fast to generate.
      Return a JSON object:
      {
        "mind_map_prompt": "A simple visualization prompt describing a concept map. (Max 30 words).",
        "summary": [
          { "heading": "Heading 1", "description": "Short desc", "visual_prompt": "Simple visual prompt" }
        ]
      }
      Summary: ${JSON.stringify(summaryData).substring(0, 1000)}`; // Trim for speed
    } else if (format === 'video') {
      promptText = `You are an educational video producer. Analyze the provided study summary and convert it into a video script.
      Return a JSON object:
      {
        "script": [
          { 
            "heading": "Heading from summary", 
            "timestamp": "0:00",
            "visual": "What is shown on screen (animations/footage)",
            "audio": "The exact voiceover script"
          }
        ]
      }
      Summary: ${JSON.stringify(summaryData)}`;
    } else if (format === 'ppt') {
      promptText = `You are a presentation designer. Convert the provided study summary into a professional slide deck outline optimized for Gamma AI.
      Return a JSON object:
      {
        "presentation_outline": "A full text block representing the presentation outline. Start with # Title, then ## Slide 1, include bullet points and [Image suggestion] per slide."
      }
      Summary: ${JSON.stringify(summaryData)}`;
    }

    const result = await model.generateContent([{ text: promptText }]);
    const outputText = result.response.text();
    
    let parsedData;
    try {
        let cleanOutput = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let startIdx = cleanOutput.indexOf('{');
        let endIdx = cleanOutput.lastIndexOf('}');
        if (cleanOutput.indexOf('[') !== -1 && (startIdx === -1 || cleanOutput.indexOf('[') < startIdx)) startIdx = cleanOutput.indexOf('[');
        if (cleanOutput.lastIndexOf(']') !== -1 && (endIdx === -1 || cleanOutput.lastIndexOf(']') > endIdx)) endIdx = cleanOutput.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) cleanOutput = cleanOutput.substring(startIdx, endIdx + 1);
        parsedData = JSON.parse(cleanOutput);
    } catch(e) {
        let cleanOutput = outputText.replace(/[\u0000-\u001F]+/g,"");
        let startIdx = cleanOutput.indexOf('{');
        let endIdx = cleanOutput.lastIndexOf('}');
        if (cleanOutput.indexOf('[') !== -1 && (startIdx === -1 || cleanOutput.indexOf('[') < startIdx)) startIdx = cleanOutput.indexOf('[');
        if (cleanOutput.lastIndexOf(']') !== -1 && (endIdx === -1 || cleanOutput.lastIndexOf(']') > endIdx)) endIdx = cleanOutput.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) cleanOutput = cleanOutput.substring(startIdx, endIdx + 1);
        try {
            parsedData = JSON.parse(cleanOutput);
        } catch(innerE) {
            console.error("Transform Parse Error. Raw text:", outputText);
            throw new Error("Failed to parse AI response as JSON.");
        }
    }
    
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Transform API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
