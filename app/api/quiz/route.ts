import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const topic = formData.get('topic') as string;
    const file = formData.get('file') as File | null;
    const count = formData.get('count') as string || '5'; // Extract the requested count

    const parts: any[] = [];

    // 1. The Prompt (Now dynamic based on 'count')
    const prompt = `
      You are an expert educational AI. 
      Context/Topic: ${topic || "Generate a general knowledge quiz."}
      
      Create a ${count}-question multiple-choice quiz based strictly on the provided topic and/or the attached PDF document.
      You MUST return ONLY a valid JSON array of objects. Do not include any conversational text.
      Format exact structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "Brief explanation of why A is correct."
        }
      ]
    `;
    parts.push({ text: prompt });

    // 2. Attach the PDF if one was uploaded
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: base64
        }
      });
    }

    // 3. Call Gemini 3.7 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    let rawText = data.candidates[0].content.parts[0].text;
    
    // 4. Bulletproof JSON Extraction
    const startIndex = rawText.indexOf('[');
    const endIndex = rawText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error("Failed to find JSON array in response:", rawText);
      return NextResponse.json({ error: 'AI returned malformed data.' }, { status: 500 });
    }

    const jsonString = rawText.substring(startIndex, endIndex + 1);
    const quizData = JSON.parse(jsonString);

    return NextResponse.json(quizData);
  } catch (error) {
    console.error("Quiz Generation Error Details:", error);
    return NextResponse.json({ error: 'Failed to generate quiz. Please try again.' }, { status: 500 });
  }
}