export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

interface NutritionAnalyzeRequest {
  imageBase64: string;
  predictions: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    total_mass: number;
  };
}

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

  let body: NutritionAnalyzeRequest;
  try {
    body = (await req.json()) as NutritionAnalyzeRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { imageBase64, predictions } = body;

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'Missing imageBase64' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!predictions) {
    return new Response(JSON.stringify({ error: 'Missing predictions' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้านโภชนาการอาหาร ภารกิจของคุณคือ:
1. ดูรูปอาหารและระบุวัตถุดิบทั้งหมดที่เห็นในจาน
2. ใช้ข้อมูลคุณค่าโภชนาการรวมที่ให้มา แบ่งสัดส่วนให้แต่ละวัตถุดิบ

ข้อมูลคุณค่าโภชนาการรวมจากการวิเคราะห์:
- แคลอรี่รวม: ${predictions.calories.toFixed(1)} kcal
- โปรตีนรวม: ${predictions.protein.toFixed(1)} g
- ไขมันรวม: ${predictions.fat.toFixed(1)} g
- คาร์โบไฮเดรตรวม: ${predictions.carbohydrates.toFixed(1)} g
- น้ำหนักรวม: ${predictions.total_mass.toFixed(1)} g

ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON
รูปแบบ:
{
  "food_name": "ชื่ออาหาร (ภาษาไทย)",
  "food_name_en": "Food name (English)",
  "description": "คำอธิบายอาหารสั้นๆ",
  "ingredients": [
    {
      "name": "ชื่อวัตถุดิบ",
      "estimated_grams": 0,
      "calories": 0,
      "protein": 0,
      "fat": 0,
      "carbohydrates": 0
    }
  ],
  "health_tips": "คำแนะนำด้านสุขภาพสั้นๆ เกี่ยวกับอาหารนี้"
}

สำคัญ: 
- ผลรวมของ calories, protein, fat, carbohydrates ของทุกวัตถุดิบต้องรวมกันแล้วเท่ากับค่ารวมที่ให้มาด้านบนอย่างแม่นยำ
- ค่า estimated_grams ของทุกวัตถุดิบรวมกันต้องเท่ากับ ${predictions.total_mass.toFixed(1)} g
- ห้ามคิดค่าเอง ให้แบ่งสัดส่วนจากค่ารวมที่ให้มาเท่านั้น`;

  try {
    const requestBody = {
      model: 'google/gemma-3n-E4B-it',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
            {
              type: 'text',
              text: systemPrompt,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 0.9,
    };

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together AI API error:', response.status, errorText);
      return new Response(JSON.stringify({
        error: 'Together AI API error',
        status: response.status,
        details: errorText,
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const responseText = result?.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }

      // Force-normalize ingredient values to match model predictions exactly
      if (analysis.ingredients && analysis.ingredients.length > 0) {
        const fields = ['calories', 'protein', 'fat', 'carbohydrates'] as const;
        for (const field of fields) {
          const target = predictions[field];
          const sum = analysis.ingredients.reduce((s: number, ing: Record<string, number>) => s + (ing[field] || 0), 0);
          if (sum > 0 && Math.abs(sum - target) > 0.1) {
            const ratio = target / sum;
            for (const ing of analysis.ingredients) {
              ing[field] = Math.round((ing[field] || 0) * ratio * 100) / 100;
            }
          }
        }
        // Normalize estimated_grams to match total_mass
        const gramsSum = analysis.ingredients.reduce((s: number, ing: Record<string, number>) => s + (ing.estimated_grams || 0), 0);
        if (gramsSum > 0 && Math.abs(gramsSum - predictions.total_mass) > 0.5) {
          const ratio = predictions.total_mass / gramsSum;
          for (const ing of analysis.ingredients) {
            ing.estimated_grams = Math.round((ing.estimated_grams || 0) * ratio * 100) / 100;
          }
        }
      }
    } catch {
      // Return raw text if JSON parsing fails
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          food_name: 'ไม่สามารถระบุได้',
          food_name_en: 'Unknown',
          description: responseText,
          ingredients: [],
          health_tips: '',
        },
        raw_response: responseText,
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('Nutrition analyze error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
