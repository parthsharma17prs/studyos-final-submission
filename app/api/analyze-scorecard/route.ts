import { NextRequest, NextResponse } from 'next/server';
import { callGeminiVision } from '@/lib/gemini';

/**
 * POST /api/analyze-scorecard
 * Gemini Vision reads marksheet image → returns structured data
 */
export async function POST(req: NextRequest) {
  try {
    const { fileBase64, mimeType } = await req.json();

    const prompt = `You are an expert academic data extractor. Analyze this marksheet/scorecard image and extract ALL data.

Return a JSON object with this EXACT structure:
{
  "studentName": "...",
  "university": "...",
  "semester": "...",
  "subjects": [
    {
      "name": "Subject Name",
      "marksObtained": 75,
      "maxMarks": 100,
      "grade": "A",
      "credits": 4,
      "percentage": 75
    }
  ],
  "cgpa": 8.2,
  "sgpa": 7.8,
  "totalPercentage": 76.5,
  "academicScoring": {
    "mathematics": 85,
    "logic": 90,
    "coding": 70,
    "theory": 80,
    "practical": 75,
    "analytical": 88
  },
  "studyPlan": [
    { "day": "Day 1-5", "subject": "weakest subject", "focus": "description" },
    { "day": "Day 6-10", "subject": "...", "focus": "..." }
  ],
  "strengths": ["subject1", "subject2"],
  "weaknesses": ["subject1", "subject2"],
  "commentary": "Brief AI analysis of overall performance"
}

Rules:
- Extract EVERY subject visible in the marksheet
- Calculate percentage for each subject
- CGPA: if shown, use it. If not, calculate from grades
- academicScoring: Infer a score from 0 to 100 for six primary categories (mathematics, logic, coding, theory, practical, analytical) based on marks in relevant subjects.
- Study plan: 30-day plan focusing on weakest subjects first
- If you can't read a value, use null`;

    const result = await callGeminiVision(fileBase64, mimeType, prompt);
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
         throw new Error('Failed to parse scorecard data');
      }
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
