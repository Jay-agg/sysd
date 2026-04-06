import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Body = {
  architecture?: unknown;
  simulationResults?: unknown;
  scoreBreakdown?: unknown;
  penalties?: string[];
  highlights?: string[];
  graphInsights?: unknown;
};

const SYSTEM = `You are a senior system design interviewer. You ONLY use the JSON data provided by the user. Do not invent metrics or repeat raw test pass/fail lists.

Respond with a single JSON object of this exact shape:
{"suggestions":[{"title":"string","explanation":"string","impact":"high"|"medium"|"low"}]}

Rules:
- Provide 3–5 suggestions.
- Focus on scalability, reliability, and latency improvements implied by the data.
- Be specific to the architecture summary and scores; avoid generic advice.
- Do not restate which tests passed or failed.`;

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  if (!key) {
    return NextResponse.json({
      suggestions: [],
      _meta: { skipped: true, reason: 'No GROQ_API_KEY configured' },
    });
  }

  const userPayload = JSON.stringify({
    architecture: body.architecture,
    simulationResults: body.simulationResults,
    scoreBreakdown: body.scoreBreakdown,
    penalties: body.penalties ?? [],
    highlights: body.highlights ?? [],
    graphInsights: body.graphInsights,
  });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPayload },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Groq error', res.status, errText);
      return NextResponse.json({ suggestions: [] });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    let raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) raw = fence[1]!.trim();
    const parsed = JSON.parse(raw) as { suggestions?: unknown };
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    const cleaned = suggestions
      .filter(
        (s: unknown): s is { title: string; explanation: string; impact: string } =>
          typeof s === 'object' &&
          s !== null &&
          typeof (s as { title?: string }).title === 'string' &&
          typeof (s as { explanation?: string }).explanation === 'string' &&
          ['high', 'medium', 'low'].includes((s as { impact?: string }).impact ?? '')
      )
      .map((s) => ({
        title: s.title,
        explanation: s.explanation,
        impact: s.impact as 'high' | 'medium' | 'low',
      }));

    return NextResponse.json({ suggestions: cleaned });
  } catch (e) {
    console.error('ai-feedback', e);
    return NextResponse.json({ suggestions: [] });
  }
}
