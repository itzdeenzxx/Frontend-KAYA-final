export const config = { runtime: 'edge' };

interface APINinjasNutrition {
  name: string;
  calories: number | string;
  serving_size_g: number | string;
  fat_total_g: number | string;
  protein_g: number | string;
  carbohydrates_total_g: number | string;
  fiber_g: number | string;
  sugar_g: number | string;
  sodium_mg: number | string;
  cholesterol_mg: number | string;
}

/** Safely parse a value that may be a number or a premium-only string */
function safeNum(val: number | string | undefined): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  return 0;
}

interface UnsplashPhoto {
  urls: { raw: string };
  user: { name: string };
}

interface AIMenu {
  name: string;
  nameEn: string;
  description: string;
  ingredients: string[];
  calories: number;
  protein: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const togetherKey = process.env.TOGETHER_API_KEY;
  const ninjasKey = process.env.API_NINJAS_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!togetherKey || !ninjasKey || !unsplashKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing API keys' }), {
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

    // Step 1: Ask LLM to recommend 4 menus related to the search query
    const systemPrompt = `You are a world-class food and nutrition expert. The user is searching for food. Recommend exactly 4 dishes that best match their query. The dishes can be from ANY cuisine worldwide — Thai, Japanese, Italian, American, Indian, etc. Match the cuisine to what the user is looking for. If the user asks in Thai or about Thai food, recommend Thai dishes. If the user asks about health benefits (e.g. "อาหารบำรุงปอด"), recommend the most relevant dishes from any cuisine.

Return ONLY a JSON array with exactly 4 items. No markdown, no explanation.

Each item must have:
- name: Name of the dish in Thai
- nameEn: English name (used for nutrition API search, keep it simple like "pad thai" or "grilled salmon")
- description: Brief Thai description (1 sentence)
- ingredients: 3-4 main ingredients in Thai
- calories: estimated calories per serving (number)
- protein: estimated protein in grams per serving (number)

Example:
[{"name":"ผัดไทกุ้งสด","nameEn":"pad thai shrimp","description":"ผัดไทเส้นจันท์กับกุ้งสด ใส่ไข่และถั่ว","ingredients":["เส้นจันท์","กุ้งสด","ไข่","ถั่วลิสง"],"calories":450,"protein":22},{"name":"แซลมอนย่าง","nameEn":"grilled salmon","description":"แซลมอนย่างเสิร์ฟพร้อมผักสด","ingredients":["แซลมอน","มะนาว","สมุนไพร","ผัก"],"calories":380,"protein":35}]`;

    const aiRes = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-E4B-it',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `ผู้ใช้ค้นหา: "${query}" กรุณาแนะนำ 4 เมนูที่เกี่ยวข้อง` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: 'AI API error' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const aiData = (await aiRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = aiData.choices?.[0]?.message?.content?.trim() || '[]';
    let menus: AIMenu[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        menus = JSON.parse(jsonMatch[0]);
      }
    } catch {
      menus = [];
    }

    if (menus.length === 0) {
      return new Response(JSON.stringify({ success: true, query, foods: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Limit to 4
    menus = menus.slice(0, 4);

    // Step 2: Fetch nutrition from API Ninjas + Unsplash images in parallel
    const results = await Promise.all(
      menus.map(async (menu) => {
        // Fetch nutrition
        const nutritionPromise = fetch(
          `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(menu.nameEn)}`,
          { headers: { 'X-Api-Key': ninjasKey } }
        )
          .then(r => r.ok ? r.json() as Promise<APINinjasNutrition[]> : [])
          .catch(() => [] as APINinjasNutrition[]);

        // Fetch image from Unsplash
        const imagePromise = fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(menu.nameEn + ' food')}&per_page=3&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${unsplashKey}` } }
        )
          .then(r => r.ok ? r.json() : { results: [] })
          .then((d: { results: UnsplashPhoto[] }) => d.results?.[0] || null)
          .catch(() => null as UnsplashPhoto | null);

        const [nutritionItems, photo] = await Promise.all([nutritionPromise, imagePromise]);

        // Aggregate nutrition from API Ninjas (free tier: fat, carbs, fiber, sugar, sodium, cholesterol)
        // Use LLM estimates for calories and protein (premium-only on API Ninjas)
        let calories = safeNum(menu.calories);
        let protein = safeNum(menu.protein);
        let fat = 0, carbohydrates = 0;
        let fiber = 0, sugar = 0, sodium = 0, cholesterol = 0;
        let servingSize = 0;

        if (Array.isArray(nutritionItems) && nutritionItems.length > 0) {
          for (const item of nutritionItems) {
            fat += safeNum(item.fat_total_g);
            carbohydrates += safeNum(item.carbohydrates_total_g);
            fiber += safeNum(item.fiber_g);
            sugar += safeNum(item.sugar_g);
            sodium += safeNum(item.sodium_mg);
            cholesterol += safeNum(item.cholesterol_mg);
            servingSize += safeNum(item.serving_size_g);
          }
        }

        const imageUrl = photo
          ? `${photo.urls.raw}&w=600&h=400&fit=crop&q=80`
          : '';

        return {
          name: menu.name,
          nameEn: menu.nameEn,
          description: menu.description,
          ingredients: menu.ingredients,
          imageUrl,
          imageCredit: photo?.user?.name || '',
          servingSize: Math.round(servingSize) || 100,
          servingSizeUnit: 'g',
          nutrients: {
            calories: Math.round(calories * 100) / 100,
            protein: Math.round(protein * 100) / 100,
            fat: Math.round(fat * 100) / 100,
            carbohydrates: Math.round(carbohydrates * 100) / 100,
            fiber: Math.round(fiber * 100) / 100,
            sugar: Math.round(sugar * 100) / 100,
            sodium: Math.round(sodium * 100) / 100,
            cholesterol: Math.round(cholesterol * 100) / 100,
            calcium: 0,
            iron: 0,
            potassium: 0,
            vitaminC: 0,
            vitaminA: 0,
          },
        };
      })
    );

    return new Response(JSON.stringify({ success: true, query, foods: results }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('AI recommend error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
