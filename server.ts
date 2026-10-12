import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateSpeechBase64(textToSpeak: string): Promise<string | null> {
  try {
    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: textToSpeak,
              speechMetadata: {
                style: 'Energetic, authoritative, supportive strength and conditioning coach',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });
    const base64Audio =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err) {
    console.error('TTS generation error:', err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // 1. Daily Readiness & Personalized Advice Endpoint
  app.post('/api/ai/daily-advice', async (req, res) => {
    try {
      const { sleepHours, soreness, energy, goal, caloriesLogged, proteinLogged } = req.body;

      const prompt = `You are Head Coach Marcus at APEX KINETIX. Analyze the athlete's daily readiness and nutrition status:
- Sleep: ${sleepHours} hours
- Muscle Soreness: ${soreness}/10 (10 is extreme soreness)
- Energy Level: ${energy}/10
- Current Training Goal: ${goal}
- Today's Logged Nutrition So Far: ${caloriesLogged} kcal, ${proteinLogged}g protein.

Provide a structured JSON coaching brief with:
1. headline: A punchy 5-8 word training directive for today.
2. workoutAdjustment: Specific recommendation on training intensity, volume, or recovery focus.
3. nutritionFocus: Specific macro or hydration target for the next 6 hours.
4. recoveryProtocol: Actionable mobility, nervous system, or sleep protocol.
5. spokenSummary: A natural 2-sentence coach voice message addressing the athlete directly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              workoutAdjustment: { type: Type.STRING },
              nutritionFocus: { type: Type.STRING },
              recoveryProtocol: { type: Type.STRING },
              spokenSummary: { type: Type.STRING },
            },
            required: [
              'headline',
              'workoutAdjustment',
              'nutritionFocus',
              'recoveryProtocol',
              'spokenSummary',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const audioBase64 = parsed.spokenSummary
        ? await generateSpeechBase64(parsed.spokenSummary)
        : null;

      res.json({ ...parsed, audioBase64 });
    } catch (error: any) {
      console.error('Error in /api/ai/daily-advice:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate personalized daily advice.',
      });
    }
  });

  // 2. Custom AI Workout Routine Generator
  app.post('/api/ai/workout-generator', async (req, res) => {
    try {
      const { targetMuscles, equipment, durationMinutes, goal, readinessScore } = req.body;

      const prompt = `Design a high-performance custom gym workout routine for an athlete with these parameters:
- Target Muscle Groups: ${targetMuscles}
- Available Equipment: ${equipment}
- Session Duration: ${durationMinutes} minutes
- Primary Goal: ${goal}
- Current Readiness Score: ${readinessScore}%

Return a JSON workout object containing 4 to 5 exercises with realistic sets, target reps, suggested load in kg, RPE target, and a biomechanics cue for each exercise.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              focus: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              coachNote: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    muscleGroup: { type: Type.STRING },
                    restSeconds: { type: Type.INTEGER },
                    formCue: { type: Type.STRING },
                    sets: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          reps: { type: Type.INTEGER },
                          weightKg: { type: Type.NUMBER },
                          rpe: { type: Type.NUMBER },
                        },
                        required: ['reps', 'weightKg', 'rpe'],
                      },
                    },
                  },
                  required: ['name', 'muscleGroup', 'restSeconds', 'formCue', 'sets'],
                },
              },
            },
            required: ['title', 'focus', 'durationMinutes', 'coachNote', 'exercises'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/workout-generator:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate custom workout routine.',
      });
    }
  });

  // 3. Real-Time Biomechanical Form Correction (Vision + Audio Cue)
  app.post('/api/ai/form-check', async (req, res) => {
    try {
      const { exerciseName, imageBase64, mimeType, athleteNotes } = req.body;

      const parts: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: `You are an elite biomechanics and strength coach analyzing an athlete performing "${exerciseName}".
${athleteNotes ? `Athlete context/sensations: "${athleteNotes}"` : ''}
${imageBase64 ? 'Inspect the provided video frame/photo closely for spinal neutrality, knee tracking, hip hinge depth, bar path, and joint stacking.' : 'Provide a real-time biomechanical assessment based on the exercise and athlete sensations.'}

Return a structured JSON evaluation with:
- score: integer 0-100 representing biomechanical safety and efficiency
- riskLevel: "Nominal", "Caution", or "High Risk"
- primaryCorrection: The single most important immediate adjustment
- jointCheckpoints: Array of 3 specific joint/posture observations (joint, status, observation)
- bracingCue: Breathing and core intra-abdominal pressure cue
- spokenCue: A concise, punchy 1-2 sentence real-time audio coaching cue to speak aloud to the lifter right now.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              riskLevel: { type: Type.STRING },
              primaryCorrection: { type: Type.STRING },
              bracingCue: { type: Type.STRING },
              spokenCue: { type: Type.STRING },
              jointCheckpoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    joint: { type: Type.STRING },
                    status: { type: Type.STRING },
                    observation: { type: Type.STRING },
                  },
                  required: ['joint', 'status', 'observation'],
                },
              },
            },
            required: [
              'score',
              'riskLevel',
              'primaryCorrection',
              'bracingCue',
              'spokenCue',
              'jointCheckpoints',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const audioBase64 = parsed.spokenCue
        ? await generateSpeechBase64(parsed.spokenCue)
        : null;

      res.json({ ...parsed, audioBase64 });
    } catch (error: any) {
      console.error('Error in /api/ai/form-check:', error);
      res.status(500).json({
        error: error?.message || 'Failed to analyze exercise form.',
      });
    }
  });

  // 4. Integrated Meal Logging & AI Food Photo Macro Analyzer
  app.post('/api/ai/meal-analyze', async (req, res) => {
    try {
      const { mealDescription, mealType, imageBase64, mimeType } = req.body;

      const parts: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: `You are a sports performance nutritionist. Analyze this ${mealType || 'meal'}${mealDescription ? ` described as: "${mealDescription}"` : ''}.
Estimate accurate macronutrients (calories, protein in grams, carbs in grams, fats in grams, fiber in grams), list the detected food items with portions, and give a 1-sentence dietitian tip for athletic performance.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.INTEGER },
              carbs: { type: Type.INTEGER },
              fats: { type: Type.INTEGER },
              fiber: { type: Type.INTEGER },
              detectedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              nutritionistTip: { type: Type.STRING },
            },
            required: [
              'mealName',
              'calories',
              'protein',
              'carbs',
              'fats',
              'fiber',
              'detectedItems',
              'nutritionistTip',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/ai/meal-analyze:', error);
      res.status(500).json({
        error: error?.message || 'Failed to analyze meal macros.',
      });
    }
  });

  // 5. Live Coaching Call & Emergency Guidance Endpoint (with 07057124133 escalation)
  app.post('/api/ai/live-call', async (req, res) => {
    try {
      const { userMessage, callMode, athleteContext } = req.body;

      const prompt = `You are Head Coach Marcus on a live voice call with an athlete at APEX KINETIX.
Call Mode: ${callMode || 'Live Coaching'} (can be "Live Coaching", "Incoming Check-In Pickup", or "Emergency Guidance").
Direct Human & Emergency Hotline Number: 07057124133.
Athlete Context: ${JSON.stringify(athleteContext || {})}
Athlete says: "${userMessage}"

Respond as a live coach on a phone call.
- If the athlete mentions acute pain, dizziness, chest tightness, joint popping, or an emergency, immediately provide calm first-aid stabilization steps AND instruct them to tap the direct hotline button to dial 07057124133 right away.
- Keep spokenResponse concise (2-3 sentences max) so it sounds natural when spoken aloud on a live call.
- Also provide 2-3 short actionSteps and a boolean escalateToHotline (true if acute injury/emergency or if they ask to speak to the human specialist at 07057124133).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenResponse: { type: Type.STRING },
              actionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              escalateToHotline: { type: Type.BOOLEAN },
              triageClassification: { type: Type.STRING },
            },
            required: [
              'spokenResponse',
              'actionSteps',
              'escalateToHotline',
              'triageClassification',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const audioBase64 = parsed.spokenResponse
        ? await generateSpeechBase64(parsed.spokenResponse)
        : null;

      res.json({
        ...parsed,
        hotlineNumber: '07057124133',
        audioBase64,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/live-call:', error);
      res.status(500).json({
        error: error?.message || 'Live coaching call response failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`APEX KINETIX server running on http://localhost:${PORT}`);
  });
}

startServer();
