import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { requirements } = await req.json();

    if (!requirements || !requirements.trim()) {
      return NextResponse.json({ error: 'Requirements are missing' }, { status: 400 });
    }

    const promptText = `You are an AI Study Planner. Based on the user's requirements below, create a structured daily study schedule. 
    Crucially, you MUST integrate elements from our platform:
    1. Reading summary of notes
    2. Practicing quizzes
    3. Applying mock test
    4. Going for Battle mode (peer-to-peer competition)
    
    The user's input: "${requirements}"

    Return the result EXCLUSIVELY in this JSON format:
    {
      "tasks": [
        {
          "time": "09:00 AM",
          "task": "Read summary notes on Data Structures",
          "subject": "Computer Science",
          "priority": "high"
        },
        {
          "time": "11:00 AM",
          "task": "Practicing quiz on Array vs Linked List",
          "subject": "Data Structures",
          "priority": "medium"
        }
      ]
    }
    
    Ensure priority is exactly one of: "high", "medium", or "low".
    Ensure the time is nicely formatted like "08:00 AM" or "02:00 PM".
    Create a logical, balanced schedule incorporating the requested features appropriately based on their text.`;

    const model = 'llama-3.3-70b-versatile';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: promptText,
        },
      ],
      model: model,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const outputText = completion.choices[0]?.message?.content || '{}';
    
    let parsedData;
    try {
        parsedData = JSON.parse(outputText);
    } catch (e) {
        console.error("JSON Parse Error, trying fallback:", e);
        try {
            const jsonMatch = outputText.match(/\{[\s\S]*\}/);
            const cleanJSON = jsonMatch ? jsonMatch[0] : outputText;
            parsedData = JSON.parse(cleanJSON.replace(/```json/g, '').replace(/```/g, ''));
        } catch (innerE) {
            throw new Error("Failed to parse AI response as JSON");
        }
    }
    
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
