import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];

function getGeminiUrl(model: string) {
  const key = process.env.GOOGLE_AI_API_KEY;
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

const TWEET_PROMPT = `You are a civic issue analyzer for Indian cities. Given the text of a tweet about a civic/infrastructure problem, extract issue details and return a JSON object with these fields:

- "title": A concise issue title (max 80 chars). Example: "Large pothole on MG Road near metro station"
- "category": One of: pothole, streetlight, water, garbage, road, noise, safety, traffic, accident, other
- "urgency": One of: low, medium, high, critical
- "description": A 1-2 sentence description of the issue based on the tweet
- "city": The Indian city name mentioned or implied (e.g. "Gurugram", "Delhi", "Mumbai"). If no city is mentioned, return null.

Rules:
- Be specific about the issue type and location clues from the tweet.
- For urgency: low = cosmetic, medium = inconvenience, high = risk of harm, critical = immediate danger.
- If the tweet doesn't describe a civic issue, still try to extract what you can with category "other".
- Return ONLY valid JSON, no markdown or extra text.`;

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/\n+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'official') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { tweetUrl } = await request.json();

    if (!tweetUrl || typeof tweetUrl !== 'string') {
      return NextResponse.json({ error: 'Tweet URL is required' }, { status: 400 });
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/\d+/i;
    if (!urlPattern.test(tweetUrl)) {
      return NextResponse.json({ error: 'Invalid tweet URL. Use format: https://x.com/user/status/123' }, { status: 400 });
    }

    // 1. Fetch tweet via oEmbed API (free, no auth required)
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
    const oembedRes = await fetch(oembedUrl);

    if (!oembedRes.ok) {
      return NextResponse.json({ error: `Could not fetch tweet (${oembedRes.status}). Check the URL and try again.` }, { status: 404 });
    }

    const contentType = oembedRes.headers.get('content-type') || '';
    if (!contentType.includes('json')) {
      return NextResponse.json({ error: 'Tweet not found or not accessible. Check the URL.' }, { status: 404 });
    }

    const oembed = await oembedRes.json();
    const tweetText = stripHtmlTags(oembed.html || '');
    const tweetAuthor = oembed.author_name || '';

    if (!tweetText) {
      return NextResponse.json({ error: 'Tweet content is empty' }, { status: 400 });
    }

    // 2. Analyze tweet with Gemini AI (try multiple models as fallback for rate limits)
    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            { text: TWEET_PROMPT },
            { text: `Tweet by @${tweetAuthor}:\n"${tweetText}"` },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
    });

    let aiText = '';
    let lastError = '';
    for (const model of GEMINI_MODELS) {
      const aiRes = await fetch(getGeminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        break;
      }

      lastError = `${model}: ${aiRes.status}`;
      console.error(`Gemini ${model} failed (${aiRes.status}), trying next model...`);
      if (aiRes.status !== 429 && aiRes.status !== 503) break; // only retry on rate limit / unavailable
    }

    if (!aiText) {
      return NextResponse.json({ error: `AI analysis failed (${lastError}). Try again in a minute.` }, { status: 502 });
    }

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 502 });
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // 3. Geocode city via Nominatim (if city was extracted)
    let lat: number | null = null;
    let lng: number | null = null;
    let address: string | null = null;

    if (analysis.city) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(analysis.city + ', India')}&format=json&limit=1`,
          { headers: { 'User-Agent': 'interns.city/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
          address = geoData[0].display_name || analysis.city;
        }
      } catch (geoErr) {
        console.error('Geocoding error:', geoErr);
      }
    }

    return NextResponse.json({
      title: analysis.title ?? '',
      category: analysis.category ?? 'other',
      urgency: analysis.urgency ?? 'medium',
      description: analysis.description ?? '',
      city: analysis.city ?? null,
      lat,
      lng,
      address,
      tweetText,
      tweetAuthor,
      tweetUrl,
    });
  } catch (err: unknown) {
    console.error('Import tweet error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
