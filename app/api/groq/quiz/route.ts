import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
        let cleanOutput = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let startIdx = cleanOutput.indexOf('{');
        let endIdx = cleanOutput.lastIndexOf('}');
        if (cleanOutput.indexOf('[') !== -1 && (startIdx === -1 || cleanOutput.indexOf('[') < startIdx)) startIdx = cleanOutput.indexOf('[');
        if (cleanOutput.lastIndexOf(']') !== -1 && (endIdx === -1 || cleanOutput.lastIndexOf(']') > endIdx)) endIdx = cleanOutput.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) cleanOutput = cleanOutput.substring(startIdx, endIdx + 1);
        quizData = JSON.parse(cleanOutput);
    } catch(e) {
        let cleanOutput = responseText.replace(/[\u0000-\u001F]+/g,"");
        let startIdx = cleanOutput.indexOf('{');
        let endIdx = cleanOutput.lastIndexOf('}');
        if (cleanOutput.indexOf('[') !== -1 && (startIdx === -1 || cleanOutput.indexOf('[') < startIdx)) startIdx = cleanOutput.indexOf('[');
        if (cleanOutput.lastIndexOf(']') !== -1 && (endIdx === -1 || cleanOutput.lastIndexOf(']') > endIdx)) endIdx = cleanOutput.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) cleanOutput = cleanOutput.substring(startIdx, endIdx + 1);
        try {
            quizData = JSON.parse(cleanOutput);
        } catch(innerE) {
            console.error("Quiz Parse Error. Raw text:", responseText);
            throw new Error("Failed to parse AI response as JSON.");
        }
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
