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
    const body = (await req.json()) as { query: string };
    const query = body.query?.trim();
    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const systemPrompt = `You are a Thai nutritionist AI assistant named "น้องกาย" (Nong Kai). The user searched for food but nothing was found in the USDA database. Your job is to recommend 3-5 Thai/international menu items that match what the user was looking for.

For each menu, provide:
- name: Thai name of the dish
- nameEn: English name
- description: Brief description in Thai (1 sentence)
- calories: estimated calories per serving (number)
- protein: estimated protein in grams (number)
- fat: estimated fat in grams (number)
- carbohydrates: estimated carbs in grams (number)
- healthBenefits: short Thai text about health benefits
- ingredients: list of 3-5 main ingredients (Thai names)
- difficulty: "easy" | "medium" | "hard"
- prepTime: estimated prep time in minutes (number)

Return ONLY a JSON array. No markdown, no explanation.

Example:
[{"name":"ข้าวผัดไก่สมุนไพร","nameEn":"Herb Chicken Fried Rice","description":"ข้าวผัดไก่ใส่สมุนไพรไทย หอมอร่อยและมีประโยชน์","calories":380,"protein":25,"fat":12,"carbohydrates":45,"healthBenefits":"อุดมด้วยโปรตีนจากไก่และสมุนไพรช่วยต้านอนุมูลอิสระ","ingredients":["ข้าวกล้อง","อกไก่","กะเพรา","พริกขี้หนู","กระเทียม"],"difficulty":"easy","prepTime":15}]`;

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
          { role: 'user', content: `ผู้ใช้ค้นหา: "${query}" แต่ไม่พบใน USDA กรุณาแนะนำเมนูที่เกี่ยวข้อง` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    let menus: unknown[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        menus = JSON.parse(jsonMatch[0]);
      }
    } catch {
      menus = [];
    }

    return new Response(JSON.stringify({ success: true, query, menus }), {
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
