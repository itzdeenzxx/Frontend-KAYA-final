export const config = { runtime: 'edge' };

declare const process: {
  env: Record<string, string | undefined>;
};

interface WorkoutRecommendRequest {
  quizAnswers: Record<string, string>;
}

// All available KAYA exercises that the system supports with pose detection
const AVAILABLE_EXERCISES = [
  {
    id: 'arm_raise',
    name: 'Arm Raise',
    nameTh: 'ยกแขนขึ้น-ลง',
    difficulty: 'beginner',
    category: 'upper_body',
    description: 'ยกแขนทั้งสองข้างขึ้นลง ยืดกล้ามเนื้อไหล่และแขน',
    targetMuscles: ['ไหล่', 'แขน', 'หลังส่วนบน'],
    caloriePerRep: 2,
    icon: 'kaya-arm',
  },
  {
    id: 'torso_twist',
    name: 'Torso Twist',
    nameTh: 'บิดลำตัวซ้าย-ขวา',
    difficulty: 'beginner',
    category: 'core',
    description: 'บิดลำตัวไปซ้ายและขวา ยืดกล้ามเนื้อแกนกลาง',
    targetMuscles: ['แกนกลาง', 'เอว', 'หลัง'],
    caloriePerRep: 2,
    icon: 'kaya-torso',
  },
  {
    id: 'knee_raise',
    name: 'Knee Raise',
    nameTh: 'ยกเข่าสลับ',
    difficulty: 'beginner',
    category: 'lower_body',
    description: 'ยกเข่าสลับซ้ายขวา เสริมสร้างกล้ามเนื้อขาและสะโพก',
    targetMuscles: ['ขา', 'สะโพก', 'หน้าท้อง'],
    caloriePerRep: 3,
    icon: 'kaya-knee',
  },
  {
    id: 'squat_arm_raise',
    name: 'Squat with Arm Raise',
    nameTh: 'สควอตพร้อมยกแขนเหนือศีรษะ',
    difficulty: 'intermediate',
    category: 'full_body',
    description: 'นั่งสควอตพร้อมยกแขนขึ้น ฝึกกล้ามเนื้อขา สะโพก และไหล่',
    targetMuscles: ['ขา', 'สะโพก', 'ไหล่', 'ก้น'],
    caloriePerRep: 5,
    icon: 'kaya-squat-arm',
  },
  {
    id: 'squat_twist',
    name: 'Squat with Twist',
    nameTh: 'สควอตพร้อมบิดลำตัว',
    difficulty: 'intermediate',
    category: 'full_body',
    description: 'นั่งสควอตพร้อมบิดลำตัว ท่าซับซ้อนที่ผสม 2 ท่า',
    targetMuscles: ['ขา', 'แกนกลาง', 'เอว', 'สะโพก'],
    caloriePerRep: 5,
    icon: 'kaya-squat-twist',
  },
  {
    id: 'high_knee_raise',
    name: 'High Knee Raise',
    nameTh: 'ยกเข่าสูงในท่ายืน',
    difficulty: 'intermediate',
    category: 'cardio',
    description: 'ยกเข่าให้สูงกว่าระดับเอว เหมาะสำหรับคาร์ดิโอ',
    targetMuscles: ['ขา', 'หน้าท้อง', 'สะโพก'],
    caloriePerRep: 4,
    icon: 'kaya-high-knee',
  },
  {
    id: 'jump_squat_arm_raise',
    name: 'Jump Squat with Arm Raise',
    nameTh: 'กระโดดสควอตพร้อมยกแขน',
    difficulty: 'advanced',
    category: 'power',
    description: 'กระโดดพร้อมทำสควอตและยกแขน ฝึกพลังระเบิด',
    targetMuscles: ['ขา', 'ก้น', 'ไหล่', 'หัวใจ'],
    caloriePerRep: 8,
    icon: 'kaya-jump-squat',
  },
  {
    id: 'standing_twist',
    name: 'Standing Twist',
    nameTh: 'บิดลำตัวในท่ายืน',
    difficulty: 'advanced',
    category: 'core',
    description: 'บิดลำตัวอย่างรวดเร็วและต่อเนื่อง วัดความเร็วและความราบรื่น',
    targetMuscles: ['แกนกลาง', 'เอว', 'หลัง'],
    caloriePerRep: 4,
    icon: 'kaya-standing-twist',
  },
  {
    id: 'running_in_place',
    name: 'Running in Place',
    nameTh: 'วิ่งยกเข่าอยู่กับที่',
    difficulty: 'advanced',
    category: 'cardio',
    description: 'วิ่งยกเข่าสูงอยู่กับที่ เหมาะสำหรับคาร์ดิโอ',
    targetMuscles: ['ขา', 'หัวใจ', 'ปอด'],
    caloriePerRep: 3,
    icon: 'kaya-running',
  },
  {
    id: 'modified_burpee',
    name: 'Modified Burpee',
    nameTh: 'เบอร์พีแบบไม่วิดพื้น',
    difficulty: 'expert',
    category: 'full_body',
    description: 'ลงนอน-ลุกขึ้น-กระโดด ท่าทางที่ซับซ้อนที่สุด',
    targetMuscles: ['ทั้งตัว', 'หัวใจ', 'ปอด', 'แกนกลาง'],
    caloriePerRep: 10,
    icon: 'kaya-burpee',
  },
  {
    id: 'jump_twist',
    name: 'Jump Twist',
    nameTh: 'กระโดดบิดลำตัวกลางอากาศ',
    difficulty: 'expert',
    category: 'agility',
    description: 'กระโดดพร้อมบิดลำตัว ฝึกความคล่องแคล่ว',
    targetMuscles: ['แกนกลาง', 'ขา', 'หัวใจ'],
    caloriePerRep: 8,
    icon: 'kaya-jump-twist',
  },
  {
    id: 'sprint_knee_raises',
    name: 'Sprint Knee Raises',
    nameTh: 'วิ่งสปรินต์ยกเข่า',
    difficulty: 'expert',
    category: 'cardio',
    description: 'วิ่งยกเข่าอย่างรวดเร็ว วัดความเร็วและจำนวนก้าว',
    targetMuscles: ['ขา', 'หัวใจ', 'ปอด', 'แกนกลาง'],
    caloriePerRep: 5,
    icon: 'kaya-sprint',
  },
];

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || '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';
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing OPENROUTER_API_KEY' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: WorkoutRecommendRequest;
  try {
    body = (await req.json()) as WorkoutRecommendRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { quizAnswers } = body;

  if (!quizAnswers || Object.keys(quizAnswers).length === 0) {
    return new Response(JSON.stringify({ error: 'Missing quiz answers' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Build the prompt for Gemma-3
  const exerciseList = AVAILABLE_EXERCISES.map(ex =>
    `- id: "${ex.id}", ชื่อ: "${ex.nameTh}" (${ex.name}), ระดับ: ${ex.difficulty}, หมวด: ${ex.category}, กล้ามเนื้อเป้าหมาย: [${ex.targetMuscles.join(', ')}], แคลอรี่/ครั้ง: ~${ex.caloriePerRep}, คำอธิบาย: ${ex.description}`
  ).join('\n');

  const quizSummary = Object.entries(quizAnswers).map(([key, value]) =>
    `- คำถาม ${key}: ${value}`
  ).join('\n');

  const systemPrompt = `คุณเป็น AI ผู้เชี่ยวชาญด้านการออกกำลังกายและ Personal Trainer
คุณต้องเลือกท่าออกกำลังกายที่เหมาะสมที่สุดจากรายการท่าที่มีอยู่ในระบบ โดยพิจารณาจากคำตอบของผู้ใช้

**ท่าออกกำลังกายที่มีในระบบทั้งหมด (12 ท่า):**
${exerciseList}

**คำตอบจากแบบสอบถาม Personalize ของผู้ใช้:**
${quizSummary}

**กฎในการเลือกท่า:**
1. เลือก 3-5 ท่าที่เหมาะสมที่สุด โดยพิจารณาจาก:
   - เป้าหมาย (goal) ของผู้ใช้
   - ระดับความฟิต (fitness_level) ของผู้ใช้
   - เวลาที่มี (available_time)
   - ส่วนที่ต้องการเน้น (focus_area)
   - ความชอบรูปแบบการออกกำลังกาย (workout_preference)
   - ข้อจำกัดทางร่างกาย (physical_limitations)
   - อายุ (age_range) และเพศ (gender)
2. เรียงลำดับจากง่ายไปยากเสมอ เพื่อ warm-up ก่อน
3. ผู้ที่ fitness_level เป็น beginner ห้ามให้ท่า expert 
4. ผู้ที่ fitness_level เป็น intermediate สามารถทำท่า beginner + intermediate ได้
5. ผู้ที่มีปัญหาเข่า/ข้อต่อ ไม่ควรให้ท่ากระโดด
6. ผู้สูงอายุ ควรเน้นท่า beginner เป็นหลัก
7. กำหนด reps ตามระดับ: beginner 8-10, intermediate 10-15, advanced 15-20, expert 12-15
8. ให้เหตุผลสั้นๆ ว่าทำไมถึงเลือกท่านี้ (ภาษาไทย)

**ตอบเป็น JSON เท่านั้น** ห้ามมีข้อความอื่นนอกจาก JSON
รูปแบบ JSON:
{
  "recommended_exercises": [
    {
      "exercise_id": "exercise_id_here",
      "reps": 10,
      "reason": "เหตุผลภาษาไทยสั้นๆ"
    }
  ],
  "workout_summary": {
    "total_exercises": 3,
    "estimated_duration_minutes": 15,
    "estimated_calories": 120,
    "difficulty_label": "ง่าย/ปานกลาง/หนัก/ผู้เชี่ยวชาญ",
    "personalized_message": "ข้อความให้กำลังใจภาษาไทย ปรับตามข้อมูลผู้ใช้"
  }
}`;

  try {
    const requestBody = {
      model: 'google/gemma-3n-e4b-it:free',
      messages: [
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 0.8,
    };

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    let response: Response | null = null;
    let lastError = '';

    try {
      response = await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://kaya-fitness.vercel.app',
          'X-Title': 'KAYA Fitness',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `OpenRouter: ${response.status} - ${errText}`;
        console.warn(`OpenRouter API failed (${response.status})`);
        response = null;
      } else {
        console.log('Successfully used OpenRouter with google/gemma-3n-e4b-it:free');
      }
    } catch (fetchErr) {
      lastError = `OpenRouter: fetch error - ${fetchErr}`;
      console.warn('OpenRouter fetch error');
      response = null;
    }

    if (!response || !response.ok) {
      console.error('OpenRouter API failed. Last error:', lastError);
      // Return fallback instead of error
      const fallback = getFallbackRecommendation(quizAnswers);
      const enrichedFallback = fallback.recommended_exercises.map(
        (rec: { exercise_id: string; reps: number; reason: string }) => {
          const fullExercise = AVAILABLE_EXERCISES.find(ex => ex.id === rec.exercise_id);
          return { ...rec, exercise_data: fullExercise || null };
        }
      );
      return new Response(JSON.stringify({
        success: true,
        recommended_exercises: enrichedFallback,
        workout_summary: fallback.workout_summary,
        _note: 'Used fallback due to API unavailability',
      }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
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

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', responseText);
      // Return a fallback recommendation
      parsedResponse = getFallbackRecommendation(quizAnswers);
    }

    // Validate the response structure
    if (!parsedResponse?.recommended_exercises || !Array.isArray(parsedResponse.recommended_exercises)) {
      parsedResponse = getFallbackRecommendation(quizAnswers);
    }

    // Validate exercise IDs exist in our system
    const validExerciseIds = AVAILABLE_EXERCISES.map(ex => ex.id);
    parsedResponse.recommended_exercises = parsedResponse.recommended_exercises.filter(
      (ex: { exercise_id: string }) => validExerciseIds.includes(ex.exercise_id)
    );

    // If no valid exercises after filtering, use fallback
    if (parsedResponse.recommended_exercises.length === 0) {
      parsedResponse = getFallbackRecommendation(quizAnswers);
    }

    // Enrich the response with full exercise data
    const enrichedExercises = parsedResponse.recommended_exercises.map(
      (rec: { exercise_id: string; reps: number; reason: string }) => {
        const fullExercise = AVAILABLE_EXERCISES.find(ex => ex.id === rec.exercise_id);
        return {
          ...rec,
          exercise_data: fullExercise || null,
        };
      }
    );

    return new Response(JSON.stringify({
      success: true,
      recommended_exercises: enrichedExercises,
      workout_summary: parsedResponse.workout_summary || {
        total_exercises: enrichedExercises.length,
        estimated_duration_minutes: enrichedExercises.length * 5,
        estimated_calories: enrichedExercises.length * 30,
        difficulty_label: 'ปานกลาง',
        personalized_message: 'โปรแกรมนี้ถูกสร้างมาเพื่อคุณโดยเฉพาะ สู้ๆ!',
      },
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('OpenRouter workout recommend error:', err);
    return new Response(JSON.stringify({
      error: 'Request failed',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// Fallback recommendation based on quiz answers when AI fails
function getFallbackRecommendation(quizAnswers: Record<string, string>) {
  const fitnessLevel = quizAnswers['fitness_level'] || 'beginner';
  
  let exercises: Array<{ exercise_id: string; reps: number; reason: string }>;
  
  switch (fitnessLevel) {
    case 'advanced':
    case 'athlete':
      exercises = [
        { exercise_id: 'arm_raise', reps: 15, reason: 'วอร์มอัพยืดกล้ามเนื้อ' },
        { exercise_id: 'jump_squat_arm_raise', reps: 15, reason: 'ฝึกพลังระเบิดขา' },
        { exercise_id: 'standing_twist', reps: 20, reason: 'เสริมแกนกลางและความเร็ว' },
        { exercise_id: 'running_in_place', reps: 30, reason: 'คาร์ดิโอเข้มข้น' },
      ];
      break;
    case 'intermediate':
      exercises = [
        { exercise_id: 'arm_raise', reps: 10, reason: 'วอร์มอัพยืดกล้ามเนื้อ' },
        { exercise_id: 'squat_arm_raise', reps: 12, reason: 'ฝึกขาและไหล่พร้อมกัน' },
        { exercise_id: 'squat_twist', reps: 10, reason: 'เสริมแกนกลางและขา' },
        { exercise_id: 'high_knee_raise', reps: 20, reason: 'คาร์ดิโอปานกลาง' },
      ];
      break;
    default: // beginner
      exercises = [
        { exercise_id: 'arm_raise', reps: 10, reason: 'ท่าพื้นฐานยืดกล้ามเนื้อไหล่' },
        { exercise_id: 'torso_twist', reps: 10, reason: 'บิดลำตัวเบาๆ ยืดแกนกลาง' },
        { exercise_id: 'knee_raise', reps: 10, reason: 'ยกเข่าสลับฝึกขาและหน้าท้อง' },
      ];
      break;
  }

  return {
    recommended_exercises: exercises,
    workout_summary: {
      total_exercises: exercises.length,
      estimated_duration_minutes: exercises.length * 5,
      estimated_calories: exercises.length * 30,
      difficulty_label: fitnessLevel === 'beginner' ? 'ง่าย' : fitnessLevel === 'intermediate' ? 'ปานกลาง' : 'หนัก',
      personalized_message: 'โปรแกรมสำรองนี้เหมาะกับระดับของคุณ สู้ๆ!',
    },
  };
}
