import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const { title, outline } = await req.json();

    if (!outline) {
      return NextResponse.json({ error: 'Outline is required' }, { status: 400 });
    }

    const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
    if (!GAMMA_API_KEY) {
      // For demo purposes, we will return a mock URL if API key is missing
      return NextResponse.json({ 
        success: true, 
        url: 'https://gamma.app/public/studyos-demo-presentation',
        message: 'Presentation generated (Mock)'
      });
    }

    const response = await axios.post('https://api.gamma.app/v1/generate-from-text', {
      contents: outline,
      source_language: 'en'
    }, {
      headers: {
        'Authorization': `Bearer ${GAMMA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({ 
      success: true, 
      url: response.data.presentation_url,
      message: 'Presentation created successfully'
    });
  } catch (error: any) {
    console.error('Gamma API Error:', error.response?.data || error.message);
    return NextResponse.json({ 
        error: error.response?.data?.message || error.message,
        success: false 
    }, { status: 500 });
  }
}
