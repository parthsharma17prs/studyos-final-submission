import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { notes, difficulty } = await req.json();

    const prompt = `You are an expert quiz generator. Create multiple-choice quiz questions from the following notes.
    The questions should be suitable for a '${difficulty}' difficulty level. Include 4 options (A, B, C, D) and clearly state the correct answer.

    Notes:
    ${notes}

    The output MUST be a JSON array of objects, where each object has:
    - 'question_number': (int)
    - 'question': (str)
    - 'options': (dict with keys 'A', 'B', 'C', 'D' and string values)
    - 'correct_answer_key': (str, e.g., 'A', 'B', 'C', 'D')
    - 'correct_answer_text': (str)
    - 'difficulty': (str, e.g., 'easy', 'medium', 'hard')
    - 'topic': (str, the main concept of the question)

    Please generate at least 3-5 questions.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional quiz generator that outputs only valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '[]';
    // Handle cases where the model might wrap the array in an object
    let quizData = JSON.parse(responseText);
    // Standardize to array
    if (quizData.questions && Array.isArray(quizData.questions)) {
      quizData = quizData.questions;
    } else if (quizData.quiz && Array.isArray(quizData.quiz)) {
      quizData = quizData.quiz;
    } else if (!Array.isArray(quizData)) {
      // Look for any array property
      const firstArray = Object.values(quizData).find(v => Array.isArray(v));
      if (firstArray) quizData = firstArray;
      else quizData = [quizData]; // Wrap if it's just one object
    }
    
    // Ensure it's not empty
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Quiz generation returned empty data");
    }
    
    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('Groq Quiz Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
