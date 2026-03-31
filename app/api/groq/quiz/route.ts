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
    const { notes, difficulty, questionCount = 5 } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an expert quiz generator. Create multiple-choice quiz questions from the following notes.
    The questions should be suitable for a '${difficulty}' difficulty level. Include 4 options (A, B, C, D) and clearly state the correct answer.

    Notes:
    ${notes}

    The output MUST be a JSON object with a single root key called "questions", containing an array of objects. Each object must have:
    - 'question_number': (int)
    - 'question': (str)
    - 'options': (dict with keys 'A', 'B', 'C', 'D' and string values)
    - 'correct_answer_key': (str, e.g., 'A', 'B', 'C', 'D')
    - 'correct_answer_text': (str)
    - 'difficulty': (str, e.g., 'easy', 'medium', 'hard')
    - 'topic': (str, the main concept of the question)

    Please generate at least ${questionCount} questions.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let quizData;
    try {
        quizData = parseAIJSON(responseText);
    } catch(e) {
        console.error("Quiz Parse Error. Raw text:", responseText);
        throw new Error("Failed to parse AI response as JSON.");
    }
    
    // Standardize to array
    if (quizData.questions && Array.isArray(quizData.questions)) {
      quizData = quizData.questions;
    } else if (quizData.quiz && Array.isArray(quizData.quiz)) {
      quizData = quizData.quiz;
    } else if (!Array.isArray(quizData)) {
      const firstArray = Object.values(quizData).find(v => Array.isArray(v));
      if (firstArray) quizData = firstArray;
      else quizData = [quizData];
    }
    
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Quiz generation returned empty data");
    }
    
    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
