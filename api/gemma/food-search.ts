export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing TOGETHER_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as { query: string };
    const query = body.query?.trim();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const systemPrompt = `You are a food search assistant. The user will type a food-related query in any language (often Thai).

Your job:
1. Understand the user's intent.
2. Extract specific food names that can be searched in the USDA FoodData Central database.
3. Return ONLY English food names that are searchable in USDA (e.g. "fried rice", "green papaya salad", "grilled chicken breast").

Rules:
- If the user types a specific food name (e.g. "พิซซ่า", "ข้าวผัด"), translate it to English.
- If the user types a general request (e.g. "อาหารที่ดีต่อสุขภาพ" = healthy food), suggest 3-5 specific food items that match.
- If the user mentions multiple foods, extract all of them.
- Return ONLY a JSON array of strings. No explanation. No markdown.
- Each string should be a simple food name suitable for USDA search (2-4 words max).
- Maximum 6 items.

Examples:
User: "พิซซ่า" → ["pizza"]
User: "ข้าวผัดหมู" → ["pork fried rice"]
User: "อาหารที่ดีต่อสุขภาพ" → ["grilled chicken breast", "salmon", "broccoli", "brown rice", "avocado"]
User: "อาหารลดน้ำหนัก" → ["chicken breast", "egg white", "greek yogurt", "spinach salad", "oatmeal"]
User: "ขนมหวานไทย" → ["mango sticky rice", "coconut pudding", "thai custard"]
User: "pizza and pasta" → ["pizza", "pasta"]
User: "อาหารโปรตีนสูง" → ["chicken breast", "tuna", "egg", "greek yogurt", "tofu"]`;

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-E4B-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI API error', status: response.status }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim() || '[]';

    // Parse the JSON array from LLM response
    let foodTags: string[] = [];
    try {
      // Try to extract JSON array from the response (LLM might add extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          foodTags = parsed
            .filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 6)
            .map((item: string) => item.trim());
        }
      }
    } catch {
      // If parsing fails, treat the whole response as a single search term
      foodTags = [content.replace(/[\[\]"]/g, '').trim()].filter(Boolean).slice(0, 1);
    }

    if (foodTags.length === 0) {
      foodTags = [query];
    }

    return new Response(JSON.stringify({ success: true, query, foodTags }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Food search AI error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
