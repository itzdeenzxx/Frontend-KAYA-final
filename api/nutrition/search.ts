export const config = { runtime: 'edge' };

interface USDAFoodNutrient {
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: USDAFoodNutrient[];
  brandName?: string;
  foodCategory?: string;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface UnsplashPhoto {
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
  };
}

function extractNutrient(nutrients: USDAFoodNutrient[], name: string): number {
  const n = nutrients.find(
    (nut) => nut.nutrientName.toLowerCase().includes(name.toLowerCase())
  );
  return n ? Math.round(n.value * 100) / 100 : 0;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const usdaKey = process.env.USDA_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!usdaKey || !unsplashKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing API keys' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Missing query parameter "q"' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Step 1: Fetch USDA food data
    const usdaRes = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=8&dataType=Foundation,SR%20Legacy&api_key=${usdaKey}`
    );

    if (!usdaRes.ok) {
      return new Response(
        JSON.stringify({ error: 'USDA API error', status: usdaRes.status }),
        { status: 502, headers: { 'content-type': 'application/json' } }
      );
    }

    const usdaData = (await usdaRes.json()) as { foods: USDAFood[] };
    const usdaFoods = usdaData.foods || [];

    // Step 2: Search Unsplash per food item — fetch multiple candidates to avoid duplicates
    const imagePromises = usdaFoods.map((food) => {
      const parts = food.description.split(',');
      const searchTerm = (parts.length > 1 ? parts.slice(1).join(' ').trim() : parts[0].trim()) + ' food';
      return fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      )
        .then(r => r.ok ? r.json() : { results: [] })
        .then((d: { results: UnsplashPhoto[] }) => d.results || [])
        .catch(() => [] as UnsplashPhoto[]);
    });

    const allCandidates = await Promise.all(imagePromises);

    // Pick unique images: track used raw URLs, skip duplicates
    const usedUrls = new Set<string>();
    const images = allCandidates.map((candidates) => {
      for (const photo of candidates) {
        if (!usedUrls.has(photo.urls.raw)) {
          usedUrls.add(photo.urls.raw);
          return photo;
        }
      }
      // All candidates were duplicates — fall back to first if available
      return candidates[0] || null;
    });

    const foods = usdaFoods.map((food: USDAFood, idx: number) => {
      const photo = images[idx];
      const imageUrl = photo
        ? `${photo.urls.raw}&w=600&h=400&fit=crop&q=80`
        : '';

      return {
        fdcId: food.fdcId,
        name: food.description,
        category: food.foodCategory || '',
        brandName: food.brandName || '',
        servingSize: food.servingSize || 100,
        servingSizeUnit: food.servingSizeUnit || 'g',
        imageUrl,
        imageCredit: photo?.user?.name || '',
        nutrients: {
          calories: extractNutrient(food.foodNutrients, 'energy'),
          protein: extractNutrient(food.foodNutrients, 'protein'),
          fat: extractNutrient(food.foodNutrients, 'Total lipid'),
          carbohydrates: extractNutrient(food.foodNutrients, 'Carbohydrate'),
          fiber: extractNutrient(food.foodNutrients, 'Fiber'),
          sugar: extractNutrient(food.foodNutrients, 'Sugars, total'),
          sodium: extractNutrient(food.foodNutrients, 'Sodium'),
          cholesterol: extractNutrient(food.foodNutrients, 'Cholesterol'),
          calcium: extractNutrient(food.foodNutrients, 'Calcium'),
          iron: extractNutrient(food.foodNutrients, 'Iron'),
          potassium: extractNutrient(food.foodNutrients, 'Potassium'),
          vitaminC: extractNutrient(food.foodNutrients, 'Vitamin C'),
          vitaminA: extractNutrient(food.foodNutrients, 'Vitamin A'),
        },
      };
    });

    return new Response(JSON.stringify({ success: true, query, foods }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Food search error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
