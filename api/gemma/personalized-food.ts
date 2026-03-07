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
      healthData?: {
        weight?: number;
        height?: number;
        age?: number;
        gender?: string;
        bmi?: number;
        activityLevel?: string;
        healthGoals?: string[];
      };
      workoutStats?: {
        totalWorkouts?: number;
        totalCaloriesBurned?: number;
        recentExercises?: string[];
      };
    };

    const { healthData, workoutStats } = body;

    const userContext = [];
    if (healthData) {
      if (healthData.weight) userContext.push(`น้ำหนัก: ${healthData.weight} kg`);
      if (healthData.height) userContext.push(`ส่วนสูง: ${healthData.height} cm`);
      if (healthData.age) userContext.push(`อายุ: ${healthData.age} ปี`);
      if (healthData.gender) userContext.push(`เพศ: ${healthData.gender}`);
      if (healthData.bmi) userContext.push(`BMI: ${healthData.bmi.toFixed(1)}`);
      if (healthData.activityLevel) userContext.push(`ระดับกิจกรรม: ${healthData.activityLevel}`);
      if (healthData.healthGoals?.length) userContext.push(`เป้าหมาย: ${healthData.healthGoals.join(', ')}`);
    }
    if (workoutStats) {
      if (workoutStats.totalWorkouts) userContext.push(`ออกกำลังกายแล้ว: ${workoutStats.totalWorkouts} ครั้ง`);
      if (workoutStats.totalCaloriesBurned) userContext.push(`เผาผลาญแล้ว: ${workoutStats.totalCaloriesBurned} kcal`);
      if (workoutStats.recentExercises?.length) userContext.push(`ออกกำลังกายล่าสุด: ${workoutStats.recentExercises.join(', ')}`);
    }

    const systemPrompt = `You are "น้องกาย AI" (Nong Kai AI), a Thai nutrition expert. Based on the user's health profile and workout data, suggest specific food search tags (English, suitable for USDA database search).

Rules:
- Return a JSON object with "tags" (array of 6-8 English food names for USDA search) and "reason" (Thai text explaining why you recommend these, max 2 sentences).
- Consider their BMI, goals, workout history to recommend appropriate foods.
- If BMI > 25: focus on low-calorie, high-protein foods.
- If goal is weight loss: lean protein, vegetables, low-carb options.
- If goal is muscle gain: high-protein, complex carbs, healthy fats.
- If goal is general health: balanced variety of nutritious foods.
- After intense workouts: recovery foods with protein and electrolytes.
- Tags must be simple English food names (2-4 words max) that work well in USDA search.

Return ONLY JSON. No markdown. No explanation outside the JSON.
Example: {"tags":["chicken breast","brown rice","broccoli","salmon","sweet potato","greek yogurt"],"reason":"จากค่า BMI และเป้าหมายลดน้ำหนัก แนะนำอาหารโปรตีนสูงไขมันต่ำ พร้อมคาร์โบฯ เชิงซ้อนเพื่อพลังงานที่ยั่งยืน"}`;

    const userMessage = userContext.length > 0
      ? `ข้อมูลผู้ใช้:\n${userContext.join('\n')}\n\nกรุณาแนะนำอาหารที่เหมาะสม`
      : `ผู้ใช้ยังไม่มีข้อมูลสุขภาพ แนะนำอาหารสุขภาพทั่วไปที่เหมาะกับทุกคน`;

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
        temperature: 0.5,
        max_tokens: 600,
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

    let result = { tags: [] as string[], reason: '' };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tags) result.tags = parsed.tags.slice(0, 8);
        if (parsed.reason) result.reason = parsed.reason;
      }
    } catch {
      result = { tags: ['chicken breast', 'salmon', 'brown rice', 'broccoli', 'egg', 'avocado'], reason: 'แนะนำอาหารสุขภาพทั่วไปที่เหมาะกับทุกคน' };
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
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
