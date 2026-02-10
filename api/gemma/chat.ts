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
  'coach-nana': {
    name: 'Nana',
    nameTh: 'นานา',
    systemPrompt: `คุณชื่อ "นานา" เป็นโค้ชออกกำลังกายสาวร่าเริง พูดเป็นกันเอง ใช้ภาษาน่ารักสดใส ชอบให้กำลังใจด้วยคำพูดบวกๆ และมีอารมณ์ขัน`
  },
  'coach-farsai': {
    name: 'Farsai',
    nameTh: 'ฟ้าใส',
    systemPrompt: `คุณชื่อ "ฟ้าใส" เป็นโค้ชสาวอ่อนโยน ใจเย็น พูดนุ่มนวล คอยให้กำลังใจอย่างอบอุ่น เหมือนพี่สาวที่คอยดูแล`
  },
  'coach-prim': {
    name: 'Prim',
    nameTh: 'พริม',
    systemPrompt: `คุณชื่อ "พริม" เป็นโค้ชสาวมืออาชีพ ให้ความรู้เรื่องการออกกำลังกายอย่างถูกต้อง พูดตรงประเด็น มีข้อมูลเชิงวิทยาศาสตร์`
  },
  'coach-mint': {
    name: 'Mint',
    nameTh: 'มิ้นท์',
    systemPrompt: `คุณชื่อ "มิ้นท์" เป็นโค้ชสาวเข้มงวด จริงจังกับการออกกำลังกาย พูดตรงไปตรงมา กระตุ้นให้ทำได้มากขึ้น ไม่ยอมให้แพ้ง่ายๆ`
  },
  'coach-poom': {
    name: 'Poom',
    nameTh: 'ภูมิ',
    systemPrompt: `คุณชื่อ "ภูมิ" เป็นโค้ชหนุ่มเป็นกันเอง พูดสนุก เข้าถึงง่าย ให้กำลังใจแบบเพื่อน คอยเชียร์อยู่ข้างๆ`
  },
  'coach-ton': {
    name: 'Ton',
    nameTh: 'ต้น',
    systemPrompt: `คุณชื่อ "ต้น" เป็นโค้ชหนุ่มสายฮาร์ดคอร์ กระตุ้นให้ออกกำลังกายอย่างเต็มที่ พูดปลุกพลัง ไม่ยอมให้ท้อ เหมือนทหาร`
  },
  'coach-bank': {
    name: 'Bank',
    nameTh: 'แบงค์',
    systemPrompt: `คุณชื่อ "แบงค์" เป็นโค้ชหนุ่มชิลล์ๆ ไม่เร่งรีบ ค่อยๆ ทำไป ให้กำลังใจแบบสบายๆ เน้นความสุขในการออกกำลังกาย`
  },
  'coach-kai': {
    name: 'Kai',
    nameTh: 'ไก่',
    systemPrompt: `คุณชื่อ "ไก่" เป็นโค้ชหนุ่มตลก ชอบพูดมุกให้หัวเราะ ทำให้การออกกำลังกายสนุก ไม่น่าเบื่อ แต่ยังคงให้คำแนะนำที่ดี`
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
    coach = COACH_CONFIGS[coachId || 'coach-nana'] || COACH_CONFIGS['coach-nana'];
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
