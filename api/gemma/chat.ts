export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

interface ChatRequest {
  message: string;
  imageBase64?: string;
  coachId?: string;
  // Custom coach data (sent from frontend when coachId === 'coach-custom')
  customCoach?: {
    name: string;
    personality: string;
    gender: 'male' | 'female';
  };
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

// Coach configurations - must match frontend coachConfig.ts
const COACH_CONFIGS: Record<string, { name: string; nameTh: string; systemPrompt: string }> = {
  'coach-aiko': {
    name: 'Aiko',
    nameTh: 'ไอโกะ',
    systemPrompt: `คุณชื่อ"ไอโกะ" โค้ชสาวร่าเริงน่ารัก พูดสั้นกระชับ ให้กำลังใจด้วยคำพูดบวกๆ ตอบไม่เกิน 2 ประโยค`
  },
  'coach-nadia': {
    name: 'Nadia',
    nameTh: 'นาเดียร์',
    systemPrompt: `คุณชื่อ"นาเดียร์" โค้ชสาวจริงจังเข้มงวด พูดตรงประเด็น กระตุ้นให้ทำได้มากขึ้น ตอบไม่เกิน 2 ประโยค`
  },
  'coach-nattakan': {
    name: 'Nattakan',
    nameTh: 'ณัฐกานต์',
    systemPrompt: `คุณชื่อ"ณัฐกานต์" โค้ชหนุ่มขี้เล่นสนุกสนาน พูดเป็นกันเอง ให้กำลังใจแบบเพื่อน ตอบไม่เกิน 2 ประโยค`
  },
  'coach-bread': {
    name: 'Mr.Bread',
    nameTh: 'นายเบรด',
    systemPrompt: `คุณชื่อ"นายเบรด" โค้ชหนุ่มห้าวหาญแข็งแกร่ง พูดปลุกพลังตรงๆ ไม่ยอมให้ท้อ ตอบไม่เกิน 2 ประโยค`
  },
  'coach-phuyailee': {
    name: 'PhuyaiLee',
    nameTh: 'ผู้ใหญ่ลี',
    systemPrompt: `คุณชื่อ"ผู้ใหญ่ลี" เป็นคนสุพรรณบุรี จิตใจดี น่ารัก เฟรนลี่กับทุกคน สนุกเฮฮา ติดเล่น พูดสำเนียงท้องถิ่นสุพรรณ ใช้คำว่า "จ้า" "น้า" "เอ้า" "ครับผม" "โอ้โห" ให้กำลังใจแบบอบอุ่นเป็นกันเอง ตอบไม่เกิน 2 ประโยค`
  }
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Get API key from environment
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing TOGETHER_API_KEY' }), {
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

  const { message, imageBase64, userContext, coachId, customCoach } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Missing message' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Get coach configuration - support custom coach
  let coach: { name: string; nameTh: string; systemPrompt: string };
  
  if (coachId === 'coach-custom' && customCoach?.name) {
    // Build dynamic system prompt from user's custom coach personality
    const personality = customCoach.personality || 'เป็นกันเอง ให้กำลังใจ';
    const suffix = customCoach.gender === 'female' ? 'ค่ะ' : 'ครับ';
    coach = {
      name: customCoach.name,
      nameTh: customCoach.name,
      systemPrompt: `คุณชื่อ "${customCoach.name}" เป็นโค้ชออกกำลังกายส่วนตัว
บุคลิกของคุณ: ${personality}
ลักษณะการพูด:
- พูดตามบุคลิกที่กำหนดอย่างเคร่งครัด
- ใช้คำลงท้าย "${suffix}"
- ให้กำลังใจและคำแนะนำตามบุคลิกของตัวเอง`,
    };
  } else {
    coach = COACH_CONFIGS[coachId || 'coach-aiko'] || COACH_CONFIGS['coach-aiko'];
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
  
  // Use coach's system prompt and personality
  const systemPrompt = `${coach.systemPrompt}

กฎสำคัญ:
- ตอบสั้นๆ กระชับ ไม่เกิน 2-3 ประโยค
- ไม่ต้องทักทายหรือสวัสดีทุกครั้งที่ตอบ เพราะเราคุยกันอยู่แล้ว
- ให้มีชื่อ "${userName}" อยู่ใน response เสมอ (เช่น "คุณ${userName}ครับ/ค่ะ...")
- ห้ามบอกข้อมูลส่วนตัวของผู้ใช้ออกไปโดยตรง (น้ำหนัก ส่วนสูง อายุ BMI) แต่ให้ใช้ข้อมูลเหล่านี้เพื่อปรับคำแนะนำให้เหมาะสม
${toneTip ? `- ${toneTip}` : ''}
${bmiTip ? `- ${bmiTip}` : ''}
- ให้กำลังใจและคำแนะนำที่เป็นประโยชน์ ตามบุคลิกของตัวเอง
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
    // Build request body for Together AI API (OpenAI-compatible)
    const contentParts: Array<Record<string, unknown>> = [];

    // Add image if provided
    if (imageBase64) {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Data}`,
        },
      });
    }

    // Add text prompt
    contentParts.push({ type: 'text', text: fullPrompt });

    const requestBody = {
      model: 'google/gemma-3n-E4B-it',
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.8,
    };

    const togetherUrl = 'https://api.together.xyz/v1/chat/completions';

    const response = await fetch(togetherUrl, {
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
        details: errorText 
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
    
    // Extract text from response
    const responseText = result?.choices?.[0]?.message?.content || 
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
    console.error('Together AI request error:', err);
    return new Response(JSON.stringify({ 
      error: 'Request failed', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
