export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

interface USDAFoodNutrient {
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: USDAFoodNutrient[];
  foodCategory?: string;
}

interface UnsplashPhoto {
  urls: { raw: string };
  user: { name: string };
}

function extractNutrient(nutrients: USDAFoodNutrient[], name: string): number {
  const n = nutrients.find(nut => nut.nutrientName.toLowerCase().includes(name.toLowerCase()));
  return n ? Math.round(n.value * 100) / 100 : 0;
}

const HEALTHY_CATEGORIES = [
  { category: 'โปรตีนสูง', categoryEn: 'high-protein', queries: ['chicken breast', 'salmon', 'egg', 'greek yogurt', 'tuna', 'tofu'] },
  { category: 'ผักและผลไม้', categoryEn: 'vegetables-fruits', queries: ['broccoli', 'spinach', 'avocado', 'banana', 'blueberry', 'sweet potato'] },
  { category: 'ธัญพืชเต็มเมล็ด', categoryEn: 'whole-grains', queries: ['brown rice', 'oatmeal', 'quinoa', 'whole wheat bread'] },
  { category: 'ไขมันดี', categoryEn: 'healthy-fats', queries: ['almond', 'walnut', 'olive oil', 'avocado oil', 'chia seeds'] },
  { category: 'อาหารลดน้ำหนัก', categoryEn: 'weight-loss', queries: ['greek yogurt', 'chicken salad', 'green tea', 'cottage cheese', 'lentils'] },
  { category: 'อาหารหลังออกกำลังกาย', categoryEn: 'post-workout', queries: ['whey protein', 'banana', 'peanut butter', 'chocolate milk', 'turkey breast'] },
];

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const usdaKey = process.env.USDA_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!usdaKey || !unsplashKey) {
    return new Response(JSON.stringify({ error: 'Missing API keys' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const results: Array<{ category: string; categoryEn: string; foods: unknown[] }> = [];

    for (const cat of HEALTHY_CATEGORIES) {
      const foods: unknown[] = [];

      for (const q of cat.queries) {
        try {
          // USDA search
          const usdaRes = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=1&dataType=Foundation,SR%20Legacy&api_key=${usdaKey}`
          );
          if (!usdaRes.ok) continue;
          const usdaData = (await usdaRes.json()) as { foods: USDAFood[] };
          const food = usdaData.foods?.[0];
          if (!food) continue;

          // Unsplash image
          let imageUrl = '';
          let imageCredit = '';
          try {
            const imgRes = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q + ' food')}&per_page=1&orientation=landscape`,
              { headers: { Authorization: `Client-ID ${unsplashKey}` } }
            );
            if (imgRes.ok) {
              const imgData = (await imgRes.json()) as { results: UnsplashPhoto[] };
              if (imgData.results[0]) {
                imageUrl = `${imgData.results[0].urls.raw}&w=600&h=400&fit=crop&q=80`;
                imageCredit = imgData.results[0].user.name;
              }
            }
          } catch { /* ignore */ }

          foods.push({
            fdcId: food.fdcId,
            name: food.description,
            imageUrl,
            imageCredit,
            nutrients: {
              calories: extractNutrient(food.foodNutrients, 'energy'),
              protein: extractNutrient(food.foodNutrients, 'protein'),
              fat: extractNutrient(food.foodNutrients, 'Total lipid'),
              carbohydrates: extractNutrient(food.foodNutrients, 'Carbohydrate'),
            },
          });
        } catch { /* skip */ }
      }

      results.push({ category: cat.category, categoryEn: cat.categoryEn, foods });
    }

    return new Response(JSON.stringify({ success: true, categories: results }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to seed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
