import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are a civic issue analyzer. Given a photo of a civic/infrastructure problem, analyze it and return a JSON object with these fields:

- "title": A concise issue title (max 80 chars). Example: "Large pothole on main road near market"
- "category": One of: pothole, streetlight, water, garbage, road, noise, safety, traffic, accident, other
- "urgency": One of: low, medium, high, critical
- "description": A 1-2 sentence description of what you see and why it matters

Rules:
- If the image doesn't show a civic issue, set category to "other" and provide a best-effort title.
- Be specific about what you see (location clues, severity, size estimates).
- For urgency: low = cosmetic, medium = inconvenience, high = risk of harm, critical = immediate danger.
- Return ONLY valid JSON, no markdown or extra text.`;

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
  }

  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Extract JSON from response (strip markdown fences if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 502 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      title: analysis.title ?? '',
      category: analysis.category ?? 'other',
      urgency: analysis.urgency ?? 'medium',
      description: analysis.description ?? '',
    });
  } catch (err: any) {
    console.error('Analyze image error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
