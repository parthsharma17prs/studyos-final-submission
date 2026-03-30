import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const content = formData.get('content') as string || '';
    const difficulty = formData.get('difficulty') as string || 'medium';
    const language = formData.get('language') as string || 'English';
    const questionCount = formData.get('questionCount') as string || '5';
    const format = formData.get('format') as string || 'text';
    const file = formData.get('file') as File | null;
    
    if (!content.trim() && !file) {
      return NextResponse.json({ error: 'Content or file is required' }, { status: 400 });
    }

    const formatPrompt = `FORMAT SELECTION: The user selected "${format}".
    
    INSTRUCTIONS FOR SELECTED FORMAT:
    - If "image": 
        * The "summary" array should be conceptual. Each item must have a detailed "visual_prompt" (specifically for charts, flowcharts, graphs, or mind map branches).
        * Populate "mind_map_prompt" with a root-level complex hierarchical mind map prompt.
        * Focus content on SPATIAL relationships and visual data representation.
    - If "video": 
        * The "description" in each "summary" item MUST be written as a "SCENE SCRIPT".
        * Format: [VISUAL] (describe the animation/footage), [AUDIO] (the voiceover script with timestamps).
        * Include scene transitions and background music suggestions.
    - If "ppt": 
        * Populate "presentation_outline" with a structured 5-7 slide deck outline.
        * Each slide needs: [TITLE], [BULLET POINTS], [IMAGE PROMPT].
        * Optimize for Gamma AI/PowerPoint structure.
    - If "text": 
        * Focus on high-density academic notes, deep analysis, and bulleted lists.
        * Use specialized "ELI5" and "real_world_use" for complexity.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const promptText = `You are a world-class cognitive study architect. Your goal is to transform the provided content into a specialized learning framework based on the user's chosen format.

    JSON SCHEMA (STRICT):
    {
      "summary": [
        {
          "heading": "Concept name",
          "description": "Content based on format (notes vs script vs visual logic)",
          "visual_prompt": "Mandatory if format='image' (describe a specific chart/graph/infographic)",
          "timestamp": "0:00 (Mandatory if format='video')"
        }
      ],
      "youtube_recommendations": [
        { "title": "Specific Video Title", "search_query": "The exact query to find this on YouTube" },
        { "title": "Alternative Perspective Title", "search_query": "YouTube search query 2" }
      ],
      "mind_map_prompt": "Mandatory if format='image' (Central hierarchical mind map description)",
      "presentation_outline": "Mandatory if format='ppt' (Slide-by-slide deck outline)",
      "quiz": [
        {
          "question": "The question",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "explanation": "Why it's correct",
          "topic": "Specific sub-topic"
        }
      ],
      "keyTerms": [{ "term": "X", "definition": "Y" }],
      "studyStrategy": "Actionable learning path",
      "mnemonics": [
        { "concept": "Topic", "mnemonic": "Memory aid", "logic": "The science behind it" }
      ],
      "eli5": "Complex concept explained for a 5-year-old using a simple analogy.",
      "real_world_use": "Concrete industry use case (e.g. How Space-X uses this, etc.)",
      "roadmap": {
        "milestones": [{ "stage": "Phase", "action": "Specific task" }],
        "common_mistakes": ["What to avoid"],
        "exam_focus": ["High-yield topics"]
      }
    }

    Rules:
    1. ${formatPrompt}
    2. LANGUAGE: ${language}.
    3. DIFFICULTY: ${difficulty}.
    4. QUESTION COUNT: ${questionCount}.
    5. Be extremely thorough in the "description" for the selected format.

    CONTENT TO ANALYZE:
    ${content}`;

    const parts: any[] = [{ text: promptText }];
    
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'application/pdf'
        }
      });
    }

    const result = await model.generateContent(parts);
    const outputText = result.response.text();
    
    let studyData;
    try {
        // Robust JSON extraction
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        const cleanJSON = jsonMatch ? jsonMatch[0] : outputText;
        studyData = JSON.parse(cleanJSON);
    } catch (e) {
        console.error("JSON Parse Error, trying fallback:", e);
        try {
          studyData = JSON.parse(outputText.replace(/```json/g, '').replace(/```/g, ''));
        } catch (innerE) {
          throw new Error("Failed to parse AI response as JSON");
        }
    }
    
    return NextResponse.json(studyData);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
