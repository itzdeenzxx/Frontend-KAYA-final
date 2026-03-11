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
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as {
      foodName: string;
      foodNameEn?: string;
      nutrients?: {
        calories?: number;
        protein?: number;
        fat?: number;
        carbohydrates?: number;
      };
    };

    const { foodName, foodNameEn, nutrients } = body;
    if (!foodName) {
      return new Response(JSON.stringify({ error: 'Missing foodName' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const nutrientInfo = nutrients
      ? `\nข้อมูลโภชนาการ: แคลอรี่ ${nutrients.calories || 0} kcal, โปรตีน ${nutrients.protein || 0}g, ไขมัน ${nutrients.fat || 0}g, คาร์โบฯ ${nutrients.carbohydrates || 0}g`
      : '';

    const systemPrompt = `You are "น้องกาย AI" (Nong Kai AI), an expert Thai chef and nutritionist. Write a detailed recipe in Thai.

Format your response as JSON with these fields:
- title: recipe name in Thai
- titleEn: recipe name in English  
- servings: number of servings (number)
- prepTime: preparation time in minutes (number)
- cookTime: cooking time in minutes (number)
- difficulty: "ง่าย" | "ปานกลาง" | "ยาก"
- ingredients: array of objects [{name: string, amount: string}] (Thai names)
- steps: array of strings (clear step-by-step instructions in Thai, each step is 1-2 sentences)
- tips: array of strings (2-3 cooking tips in Thai)
- nutritionPerServing: {calories: number, protein: number, fat: number, carbohydrates: number}

Return ONLY valid JSON. No markdown. No extra text.`;

    const userMessage = `เขียนสูตรอาหาร "${foodName}"${foodNameEn ? ` (${foodNameEn})` : ''}${nutrientInfo}\n\nเขียนสูตรที่ละเอียด ทำตามง่าย พร้อมเคล็ดลับ`;

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
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI API error' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() || '{}';

    let recipe = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      }
    } catch {
      recipe = null;
    }

    if (!recipe) {
      return new Response(JSON.stringify({ error: 'Failed to generate recipe' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, recipe }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
