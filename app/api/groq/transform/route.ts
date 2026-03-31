import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function parseAIJSON(text: string) {
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(clean); } catch(e) {}
  
  let objStart = clean.indexOf('{'); let objEnd = clean.lastIndexOf('}');
  let arrStart = clean.indexOf('['); let arrEnd = clean.lastIndexOf(']');
  let startIdx = objStart !== -1 ? objStart : arrStart;
  let endIdx = objEnd !== -1 ? objEnd : arrEnd;
  if (objStart !== -1 && arrStart !== -1) startIdx = Math.min(objStart, arrStart);
  if (objEnd !== -1 && arrEnd !== -1) endIdx = Math.max(objEnd, arrEnd);
  
  if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    clean = clean.substring(startIdx, endIdx + 1);
    try { return JSON.parse(clean); } catch(e) {}
    let noNewlines = clean.replace(/\n/g, "\\n").replace(/\r/g, "");
    try { return JSON.parse(noNewlines); } catch(e) {}
    let superClean = clean.replace(/[\u0000-\u001F]+/g, "");
    try { return JSON.parse(superClean); } catch (e) {}
    let noTrailing = superClean.replace(/,(?=\s*[}\]])/g, "");
    try { return JSON.parse(noTrailing); } catch(e) {}
    let openBraces = (noTrailing.match(/\{/g) || []).length;
    let closeBraces = (noTrailing.match(/\}/g) || []).length;
    let openBrackets = (noTrailing.match(/\[/g) || []).length;
    let closeBrackets = (noTrailing.match(/\]/g) || []).length;
    let autoClose = noTrailing + '}'.repeat(Math.max(0, openBraces - closeBraces)) + ']'.repeat(Math.max(0, openBrackets - closeBrackets));
    try { return JSON.parse(autoClose); } catch(e) {}
  }
  throw new Error("Unable to parse AI response");
}

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
        parsedData = parseAIJSON(outputText);
    } catch(e) {
        console.error("Transform Parse Error. Raw text:", outputText);
        throw new Error("Failed to parse AI response as JSON.");
    }
    
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Transform API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
