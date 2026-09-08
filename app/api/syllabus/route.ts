import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { examName } = await req.json();

    if (!examName) {
      return NextResponse.json({ error: 'Exam name is required.' }, { status: 400 });
    }

    // UPDATED PROMPT: Demanding extreme granularity and separating major disciplines
    const prompt = `
      You are an expert academic curriculum designer for competitive examinations.
      Generate a HIGHLY GRANULAR, exhaustive, and detailed syllabus breakdown for the examination: "${examName}".

      CRITICAL INSTRUCTIONS:
      1. DO NOT group major distinct disciplines together. NEVER group "History, Polity, and Geography" or "Physics, Chemistry, and Biology" into a single topic. Treat them as entirely separate subjects (e.g., "Indian History", "Indian Geography", "Indian Polity").
      2. Break down subjects into highly specific micro-topics. Instead of a broad topic like "Geography", list granular topics like "Indian River Systems", "Mountain Ranges & Passes", "Climate & Monsoons", "Soils & Agriculture". Instead of "Ancient History", list "Indus Valley Civilization", "Vedic Age", "Maurya Empire", etc.
      3. Provide between 8 to 15 primary subjects.
      4. Provide between 10 to 25 highly specific, granular topics per subject.

      Return ONLY a strict JSON object with NO conversational markdown text. Ensure the JSON is properly formatted and escaped.
      Format exact structure:
      {
        "examName": "${examName}",
        "subjects": [
          {
            "name": "Detailed Subject Name (e.g., Indian Geography)",
            "topics": ["Micro Topic 1", "Micro Topic 2", "Micro Topic 3"]
          }
        ]
      }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const rawText = data.candidates[0].content.parts[0].text;
    
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1) {
      return NextResponse.json({ error: 'Malformed AI response.' }, { status: 500 });
    }

    const jsonString = rawText.substring(startIndex, endIndex + 1);
    const parsedData = JSON.parse(jsonString);
    
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Syllabus generation failed:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}