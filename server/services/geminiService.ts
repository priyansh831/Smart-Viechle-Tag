import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

async function withTimeout<T>(promise: Promise<T>, ms: number = 4500, label: string = 'Gemini API'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} request timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

export interface DamageAnalysisResult {
  hasDamage: boolean;
  structuralImpact: string;
  affectedParts: string[];
  severity: 'None' | 'Low' | 'Medium' | 'Critical';
  drivable: boolean;
  summary: string;
  recommendations?: string;
}

export interface MessageProcessingResult {
  translatedMessage: string;
  detectedLanguage: string;
  urgency: 'LOW' | 'MEDIUM' | 'CRITICAL';
  urgencyReasoning: string;
  intentCategory: string;
  actionAdvisory: string;
  quickReplies: string[];
}

/**
 * Visual Damage Assessment using Gemini Vision
 */
export async function analyzeDamage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<DamageAnalysisResult> {
  const ai = getAIClient();

  if (!ai) {
    console.warn('GEMINI_API_KEY not configured, using heuristic damage assessment fallback.');
    return {
      hasDamage: true,
      structuralImpact: 'Visual photo attached by bystander. Manual inspection recommended.',
      affectedParts: ['Body Panel / Exterior'],
      severity: 'Medium',
      drivable: true,
      summary: 'Photo provided by bystander. Automatic AI vision unavailable without API key.',
      recommendations: 'Inspect vehicle exterior upon return.'
    };
  }

  try {
    // Strip header prefix if present (e.g. data:image/png;base64,...)
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `You are an expert automotive damage assessor and emergency vehicle safety analyst.
Analyze this photo taken of a vehicle or parking scene by a bystander.
Examine the vehicle condition, any collision or cosmetic impact, scratches, denting, shattered glass, deflated tires, obstruction or hazards.
Return a structured JSON assessment with:
- hasDamage: boolean
- structuralImpact: concise description of mechanical or body impact (e.g., "Front-left bumper crushed, grille misaligned, no fluid leak visible")
- affectedParts: array of identified parts (e.g., ["Front Bumper", "Left Headlight", "Fender"])
- severity: "None" | "Low" | "Medium" | "Critical"
- drivable: boolean (can vehicle be safely driven without immediate tow?)
- summary: 1-2 sentence high-level summary for the owner
- recommendations: immediate recommended action (e.g., "Exchange info if other party present; take photos before moving")`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasDamage: { type: Type.BOOLEAN },
            structuralImpact: { type: Type.STRING },
            affectedParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            severity: {
              type: Type.STRING,
              description: 'Must be None, Low, Medium, or Critical'
            },
            drivable: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            recommendations: { type: Type.STRING }
          },
          required: ['hasDamage', 'structuralImpact', 'affectedParts', 'severity', 'drivable', 'summary']
        }
      }
    }),
    5000,
    'Damage Vision Assessment'
  );

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    const validSeverities: Array<'None' | 'Low' | 'Medium' | 'Critical'> = ['None', 'Low', 'Medium', 'Critical'];
    const severity = validSeverities.includes(parsed.severity) ? parsed.severity : 'Medium';

    return {
      hasDamage: typeof parsed.hasDamage === 'boolean' ? parsed.hasDamage : true,
      structuralImpact: parsed.structuralImpact || 'Minor external damage observed.',
      affectedParts: Array.isArray(parsed.affectedParts) && parsed.affectedParts.length > 0 ? parsed.affectedParts : ['Exterior Body'],
      severity,
      drivable: typeof parsed.drivable === 'boolean' ? parsed.drivable : true,
      summary: parsed.summary || 'Damage assessment completed.',
      recommendations: parsed.recommendations || 'Inspect vehicle carefully.'
    };
  } catch (error) {
    console.error('Error analyzing damage with Gemini Vision:', error);
    return {
      hasDamage: true,
      structuralImpact: 'Photo provided. Unable to complete automated vision analysis.',
      affectedParts: ['Exterior Area'],
      severity: 'Medium',
      drivable: true,
      summary: 'Image received from bystander. Please review the photo directly in the dashboard.',
      recommendations: 'Check the vehicle in person.'
    };
  }
}

/**
 * Multilingual Translation, Urgency & Intent Classification, and Owner Quick Reply Generation
 */
export async function processIncomingMessage(
  text: string,
  ownerLanguage: string = 'en'
): Promise<MessageProcessingResult> {
  const ai = getAIClient();

  if (!ai) {
    console.warn('GEMINI_API_KEY not configured, using heuristic text analysis fallback.');
    return fallbackProcessMessage(text, ownerLanguage);
  }

  try {
    const prompt = `Analyze this emergency/parking bystander message sent to a vehicle owner in an Indian or international context:
MESSAGE: "${text.replace(/"/g, '\\"')}"
OWNER PREFERRED LANGUAGE: "${ownerLanguage}"

Perform the following tasks:
1. Translate the message accurately into the vehicle owner's preferred language ("${ownerLanguage}"), preserving emotional urgency, polite phrasing, and location specifics.
   - Note: The message may be in English, Hindi (हिन्दी), Hinglish (e.g., "bhaiya gaadi gate ke aage khadi hai", "towing crane aa gayi hai", "challan kat jayega", "window khuli hai", "chalan"), Marathi, Tamil, Telugu, Bengali, Gujarati, Punjabi, or Kannada.
   - Translate colloquial Indian terms naturally (e.g. "gaadi" -> "vehicle/car", "bhaiya" -> "brother/sir", "towing crane" -> "police tow truck", "society gate" -> "apartment/community gate", "barish" -> "rain").
2. Detect the original language of the bystander's message (e.g. "Hinglish", "Hindi", "English", "Marathi", "Tamil", "Gujarati", etc.).
3. Classify urgency:
   - "CRITICAL": vehicle hit/collision, alarm blaring, hazard/smoke/fire, child/pet inside, traffic police towing crane actively lifting vehicle, break-in or severe risk.
   - "MEDIUM": blocking society gate/driveway/commercial delivery bay, warning of impending tow or police challan, window open in heavy monsoon rain.
   - "LOW": headlights or hazard blinkers left on, courtesy note, deflated tire reminder.
4. Categorize intent into one of: "PARKING_BLOCK", "COLLISION_DAMAGE", "LIGHTS_ON", "TOWING_RISK", "HAZARD_SAFETY", "ALARM", "VEHICLE_ISSUE", "OTHER".
5. Provide a short 1-sentence action advisory for the driver (e.g. "Traffic police towing alert near Bandra; move immediately to avoid challan.").
6. Generate exactly 3 context-aware, respectful quick replies that the vehicle owner can send back to the bystander with a single tap. If the original message was in Hindi or Hinglish, provide polite Hindi/Hinglish options (e.g., "Haan bhaiya, bas 2 minute mein aa raha hoon!", "Bahut shukriya batane ke liye, abhi move karta hoon.", "Maafi chahta hoon, emergency mein khadi karni padi."). If in English, provide clear English options.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedMessage: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
              urgency: {
                type: Type.STRING,
                description: 'Must be LOW, MEDIUM, or CRITICAL'
              },
              urgencyReasoning: { type: Type.STRING },
              intentCategory: { type: Type.STRING },
              actionAdvisory: { type: Type.STRING },
              quickReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['translatedMessage', 'detectedLanguage', 'urgency', 'intentCategory', 'actionAdvisory', 'quickReplies']
          }
        }
      }),
      4500,
      'Message Processing'
    );

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const validUrgency = ['LOW', 'MEDIUM', 'CRITICAL'].includes(parsed.urgency)
      ? (parsed.urgency as 'LOW' | 'MEDIUM' | 'CRITICAL')
      : 'MEDIUM';

    return {
      translatedMessage: parsed.translatedMessage || text,
      detectedLanguage: parsed.detectedLanguage || 'English',
      urgency: validUrgency,
      urgencyReasoning: parsed.urgencyReasoning || 'Assessed by Gemini AI classification engine.',
      intentCategory: parsed.intentCategory || 'GENERAL',
      actionAdvisory: parsed.actionAdvisory || 'Review alert and take appropriate action.',
      quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length >= 3
        ? parsed.quickReplies.slice(0, 3)
        : [
            'Haan bhaiya, bas 2 minute mein aa raha hoon!',
            'Thank you for letting me know, stepping out now.',
            'Understood, moving vehicle right away.'
          ]
    };
  } catch (error) {
    console.error('Error processing incoming message with Gemini:', error);
    return fallbackProcessMessage(text, ownerLanguage);
  }
}

function fallbackProcessMessage(text: string, ownerLanguage: string): MessageProcessingResult {
  const lower = text.toLowerCase();
  let urgency: 'LOW' | 'MEDIUM' | 'CRITICAL' = 'LOW';
  let intentCategory = 'OTHER';
  let advisory = 'Acknowledge alert and inspect vehicle if needed.';

  if (lower.includes('crash') || lower.includes('hit') || lower.includes('dent') || lower.includes('accident') || lower.includes('damage') || lower.includes('fire') || lower.includes('smoke') || lower.includes('police') || lower.includes('crane') || lower.includes('challan') || lower.includes('towing') || lower.includes('tow')) {
    urgency = lower.includes('tow') || lower.includes('crane') || lower.includes('police') ? 'CRITICAL' : 'CRITICAL';
    intentCategory = lower.includes('tow') || lower.includes('crane') ? 'TOWING_RISK' : 'COLLISION_DAMAGE';
    advisory = lower.includes('tow') ? 'Traffic police towing reported. Relocate vehicle immediately to prevent challan.' : 'Emergency condition reported. Check vehicle immediately.';
  } else if (lower.includes('block') || lower.includes('gate') || lower.includes('move') || lower.includes('driveway') || lower.includes('society') || lower.includes('khadi') || lower.includes('hatao')) {
    urgency = 'MEDIUM';
    intentCategory = 'PARKING_BLOCK';
    advisory = 'Vehicle is impeding gate or driveway access. Move vehicle promptly.';
  } else if (lower.includes('rain') || lower.includes('barish') || lower.includes('window') || lower.includes('khuli')) {
    urgency = 'MEDIUM';
    intentCategory = 'VEHICLE_ISSUE';
    advisory = 'Window open during rainfall. Close window to protect vehicle cabin.';
  } else if (lower.includes('light') || lower.includes('lamp') || lower.includes('battery') || lower.includes('hazard')) {
    urgency = 'LOW';
    intentCategory = 'LIGHTS_ON';
    advisory = 'Turn off vehicle lights to prevent battery drain.';
  } else if (lower.includes('alarm') || lower.includes('horn') || lower.includes('siren')) {
    urgency = 'MEDIUM';
    intentCategory = 'ALARM';
    advisory = 'Vehicle security system triggered.';
  } else if (lower.includes('tire') || lower.includes('tyre') || lower.includes('puncture') || lower.includes('flat')) {
    urgency = 'LOW';
    intentCategory = 'VEHICLE_ISSUE';
    advisory = 'Deflated or punctured tire reported. Check tire pressure.';
  }

  const isHindiContext = lower.includes('bhai') || lower.includes('gaadi') || lower.includes('gate') || lower.includes('barish') || lower.includes('khuli') || lower.includes('aapki');

  return {
    translatedMessage: text,
    detectedLanguage: isHindiContext ? 'Hinglish / Hindi' : 'English',
    urgency,
    urgencyReasoning: 'Heuristic keyword analysis applied.',
    intentCategory,
    actionAdvisory: advisory,
    quickReplies: isHindiContext
      ? [
          'Haan bhaiya, bas 2 minute mein aa raha hoon!',
          'Bahut shukriya batane ke liye, abhi move karta hoon.',
          'Maafi chahta hoon, guard ko bol diya hai gaadi aage karne.'
        ]
      : [
          'Coming down in 2 minutes to move it!',
          'Thank you for the heads-up, checking right now.',
          'Stepping outside right away to resolve this.'
        ]
  };
}

/**
 * Polish / De-escalate a bystander message using Gemini 3.8 Flash
 */
export async function polishAlertMessage(
  rawText: string,
  tone: 'polite' | 'urgent' | 'deescalate' = 'polite'
): Promise<{ polishedText: string; detectedLanguage: string; alternatives: string[] }> {
  const ai = getAIClient();

  if (!ai) {
    return {
      polishedText: rawText.trim(),
      detectedLanguage: 'English / Hindi',
      alternatives: [
        `Please move your vehicle: ${rawText.trim()}`,
        `Bhaiya please gaadi aage kar lijiye: ${rawText.trim()}`
      ]
    };
  }

  try {
    const prompt = `You are a respectful vehicle communication assistant in India.
A bystander wants to alert a vehicle owner.
Raw Message: "${rawText.replace(/"/g, '\\"')}"
Tone requested: ${tone}

Tasks:
1. Polish the message to be courteous, clear, respectful and effective, preventing road rage and unnecessary panic.
2. If written in Hindi, Hinglish, Marathi, or English, keep the primary cultural voice natural and polite (e.g. using "Namaste", "Bhaiya", or "Dear Owner").
3. Detect the primary language (e.g., Hinglish, Hindi, English).
4. Provide 2 alternative phrasing options (one concise, one slightly more urgent or polite).`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              polishedText: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['polishedText', 'detectedLanguage', 'alternatives']
          }
        }
      }),
      4500,
      'Message Polish'
    );

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      polishedText: parsed.polishedText || rawText,
      detectedLanguage: parsed.detectedLanguage || 'Hinglish / English',
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : []
    };
  } catch (err) {
    console.error('Error polishing message with Gemini:', err);
    return {
      polishedText: rawText.trim(),
      detectedLanguage: 'Hinglish / English',
      alternatives: []
    };
  }
}

/**
 * Generate context-aware custom owner replies using Gemini 3.8 Flash
 */
export async function suggestOwnerReplies(
  alertMessage: string,
  userInstruction?: string,
  language: string = 'en'
): Promise<string[]> {
  const ai = getAIClient();

  if (!ai) {
    return [
      'Haan ji, bas 2 minute mein aa raha hoon!',
      'Thank you for informing, resolving it right away.',
      'Key is with building security guard.'
    ];
  }

  try {
    const prompt = `Vehicle owner received this alert:
"${alertMessage.replace(/"/g, '\\"')}"

${userInstruction ? `Owner's intent/notes: "${userInstruction.replace(/"/g, '\\"')}"` : ''}
Preferred language: ${language}

Generate 3 concise, highly courteous, direct SMS-style replies that the owner can tap to send to the bystander immediately.
If in India, provide natural bilingual / Hinglish or Hindi replies (e.g., "Haan bhaiya, bas 2 minute mein aa raha hoon!").
Return as a JSON array of strings.`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }),
      4500,
      'Owner Reply Generator'
    );

    const replies = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(replies) && replies.length > 0) {
      return replies.slice(0, 3);
    }
    return [
      'Haan bhaiya, bas 2 minute mein aa raha hoon!',
      'Thank you for the update, moving it immediately.',
      'Sorry for the inconvenience, guard is clearing it now.'
    ];
  } catch (err) {
    console.error('Error generating suggestions with Gemini:', err);
    return [
      'Haan bhaiya, bas 2 minute mein aa raha hoon!',
      'Thank you for letting me know, stepping out now.',
      'Understood, moving vehicle right away.'
    ];
  }
}

/**
 * Verify Gemini connection
 */
export async function testGeminiConnection(): Promise<{ connected: boolean; model: string; message: string }> {
  const ai = getAIClient();
  if (!ai) {
    return {
      connected: false,
      model: 'gemini-3.8-flash',
      message: 'GEMINI_API_KEY environment variable is not set.'
    };
  }

  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Respond with the word "CONNECTED" in JSON format: {"status": "CONNECTED"}'
      }),
      3500,
      'Connection Test'
    );
    return {
      connected: true,
      model: 'gemini-3.8-flash',
      message: res.text?.trim() || 'Connected successfully.'
    };
  } catch (error: any) {
    return {
      connected: false,
      model: 'gemini-3.8-flash',
      message: error?.message || 'Error contacting Gemini API'
    };
  }
}

