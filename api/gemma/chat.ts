export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

interface ChatRequest {
  message: string;
  imageBase64?: string;
  userContext?: {
    name: string;
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
    bmi?: number;
    activityLevel?: string;
    healthGoals?: string[];
    currentExercise?: string;
    reps?: number;
    targetReps?: number;
    nextExercises?: string[];
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Get API key from environment
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing GOOGLE_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { message, imageBase64, userContext } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Missing message' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Build system context
  const userName = userContext?.name || 'ผู้ใช้';
  const currentExercise = userContext?.currentExercise || 'ออกกำลังกาย';
  const currentReps = userContext?.reps ?? 0;
  const targetReps = userContext?.targetReps ?? 10;
  const nextExercises = userContext?.nextExercises || [];
  
  // Determine age-appropriate tone
  const age = userContext?.age;
  let toneTip = '';
  if (age) {
    if (age < 18) toneTip = 'ใช้ภาษาสนุกสนาน เป็นกันเอง';
    else if (age < 30) toneTip = 'ใช้ภาษากระตุ้นพลังงาน';
    else if (age < 50) toneTip = 'ใช้ภาษาสุภาพ เป็นมืออาชีพ';
    else toneTip = 'ใช้ภาษาอ่อนโยน ห่วงใยสุขภาพ';
  }
  
  // BMI context for appropriate advice
  const bmi = userContext?.bmi;
  let bmiTip = '';
  if (bmi) {
    if (bmi < 18.5) bmiTip = 'ผู้ใช้น้ำหนักต่ำกว่าเกณฑ์ ควรแนะนำเบาๆ';
    else if (bmi < 25) bmiTip = 'ผู้ใช้มีน้ำหนักปกติ';
    else if (bmi < 30) bmiTip = 'ผู้ใช้น้ำหนักเกิน ควรกระตุ้นให้ออกกำลังกายสม่ำเสมอ';
    else bmiTip = 'ผู้ใช้อ้วน ควรระวังท่าที่หนักเกินไป แนะนำค่อยๆ ทำ';
  }
  
  const nextExStr = nextExercises.length > 0 ? `ท่าถัดไป: ${nextExercises.join(', ')}` : 'นี่คือท่าสุดท้าย';
  
  const systemPrompt = `คุณชื่อ "น้องกาย" เป็น AI โค้ชออกกำลังกายและดูแลสุขภาพส่วนตัว พูดภาษาไทยเป็นหลัก

กฎสำคัญ:
- ตอบสั้นๆ กระชับ ไม่เกิน 2-3 ประโยค
- ไม่ต้องทักทายหรือสวัสดีทุกครั้งที่ตอบ เพราะเราคุยกันอยู่แล้ว
- ให้มีชื่อ "${userName}" อยู่ใน response เสมอ (เช่น "คุณ${userName}ครับ...")
- ห้ามบอกข้อมูลส่วนตัวของผู้ใช้ออกไปโดยตรง (น้ำหนัก ส่วนสูง อายุ BMI) แต่ให้ใช้ข้อมูลเหล่านี้เพื่อปรับคำแนะนำให้เหมาะสม
${toneTip ? `- ${toneTip}` : ''}
${bmiTip ? `- ${bmiTip}` : ''}
- ให้กำลังใจและคำแนะนำที่เป็นประโยชน์ เป็นมิตร
- ถ้ามีรูปท่าทางให้วิเคราะห์ฟอร์มและให้คำแนะนำ

สถานะการออกกำลังกายตอนนี้:
- ท่าปัจจุบัน: ${currentExercise}
- ทำไปแล้ว: ${currentReps}/${targetReps} ครั้ง
- ${nextExStr}`;

  // Build user context string
  let contextStr = '';
  if (userContext) {
    const parts: string[] = [];
    if (userContext.name) parts.push(`ชื่อผู้ใช้: ${userContext.name}`);
    if (userContext.weight) parts.push(`น้ำหนัก: ${userContext.weight} kg`);
    if (userContext.height) parts.push(`ส่วนสูง: ${userContext.height} cm`);
    if (userContext.age) parts.push(`อายุ: ${userContext.age} ปี`);
    if (userContext.gender) {
      const genderTh = userContext.gender === 'male' ? 'ชาย' : userContext.gender === 'female' ? 'หญิง' : 'อื่นๆ';
      parts.push(`เพศ: ${genderTh}`);
    }
    if (userContext.bmi) parts.push(`BMI: ${userContext.bmi.toFixed(1)}`);
    if (userContext.activityLevel) {
      const levelTh: Record<string, string> = {
        sedentary: 'นั่งทำงานเป็นหลัก',
        light: 'ออกกำลังกายเบาๆ',
        moderate: 'ออกกำลังกายปานกลาง',
        active: 'ออกกำลังกายสม่ำเสมอ',
        very_active: 'ออกกำลังกายหนัก',
      };
      parts.push(`ระดับกิจกรรม: ${levelTh[userContext.activityLevel] || userContext.activityLevel}`);
    }
    if (userContext.healthGoals?.length) {
      const goalsTh: Record<string, string> = {
        lose_weight: 'ลดน้ำหนัก',
        build_muscle: 'สร้างกล้ามเนื้อ',
        improve_flexibility: 'เพิ่มความยืดหยุ่น',
        general_fitness: 'สุขภาพทั่วไป',
        reduce_stress: 'ลดความเครียด',
      };
      const translatedGoals = userContext.healthGoals.map(g => goalsTh[g] || g);
      parts.push(`เป้าหมาย: ${translatedGoals.join(', ')}`);
    }
    if (userContext.currentExercise) parts.push(`กำลังทำท่า: ${userContext.currentExercise}`);
    if (userContext.reps !== undefined) parts.push(`ทำไปแล้ว: ${userContext.reps} ครั้ง`);
    if (userContext.targetReps !== undefined) parts.push(`เป้าหมาย: ${userContext.targetReps} ครั้ง`);
    
    if (parts.length > 0) {
      contextStr = `\n\nข้อมูลผู้ใช้:\n${parts.join('\n')}`;
    }
  }

  const fullPrompt = `${systemPrompt}${contextStr}\n\nคำถามจากผู้ใช้: ${message}`;

  try {
    // Build request body for Gemma-3 via Google GenAI API
    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts: [] as Array<Record<string, unknown>>,
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.8,
        topK: 40,
      },
    };

    const parts = (requestBody.contents as Array<{ parts: Array<Record<string, unknown>> }>)[0].parts;

    // Add image if provided
    if (imageBase64) {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    // Add text prompt
    parts.push({ text: fullPrompt });

    // Use gemma-3-27b-it model
    const gemmaUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${apiKey}`;

    const response = await fetch(gemmaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemma API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Gemma API error', 
        status: response.status,
        details: errorText 
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    
    // Extract text from response
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || 
                         'ขอโทษครับ ผมไม่เข้าใจคำถาม ลองถามใหม่อีกครั้งนะครับ';

    return new Response(JSON.stringify({ 
      success: true,
      response: responseText,
    }), {
      status: 200,
      headers: { 
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemma request error:', err);
    return new Response(JSON.stringify({ 
      error: 'Request failed', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
