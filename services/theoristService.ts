import { GoogleGenAI, Type } from "@google/genai";
import type { EquationParams, Evaluation } from '../types';

// Safely access the API key to avoid ReferenceError in environments without 'process' defined.
const API_KEY = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Theorist will use deterministic variations.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    D: { type: Type.NUMBER, description: "Diffusion coefficient. Should be positive." },
    omega: { type: Type.NUMBER, description: "Angular velocity for rotation." },
    source_amp: { type: Type.NUMBER, description: "Amplitude of the source term." },
    damping: { type: Type.NUMBER, description: "Damping/dissipation coefficient." },
  },
  required: ["D", "omega", "source_amp", "damping"],
};

const getDeterministicFallback = (prevParams: EquationParams, evaluation: Evaluation): EquationParams => {
  console.log("Using deterministic fallback for Theorist agent.");
  const newParams = { ...prevParams };
  if (evaluation.suggestions.some(s => s.toLowerCase().includes("omega"))) {
      newParams.omega = Math.max(0, newParams.omega * 0.5 - 1);
  }
  if (evaluation.suggestions.some(s => s.toLowerCase().includes("dissipation"))) {
      newParams.damping = Math.min(0.1, (newParams.damping || 0) + 0.01);
  }
  if (evaluation.suggestions.some(s => s.toLowerCase().includes("cfl"))) {
      newParams.D *= 0.8;
  }
  newParams.D = Math.max(1e-4, newParams.D);
  return newParams;
};

export const getRevisedParams = async (
  prevParams: EquationParams,
  evaluation: Evaluation
): Promise<EquationParams> => {
  if (!API_KEY) {
    // Fallback to deterministic variation if API key is not available
    return getDeterministicFallback(prevParams, evaluation);
  }

  const prompt = `You are a theoretical physicist agent exploring differential equations.
Your goal is to propose revised parameters for an equation based on feedback from a simulation.
The equation is of the form: ∂u/∂t = D∇²u - v·∇u + S - γu, where D is diffusion, ω (omega) controls the rotational velocity v, S is the source term amplitude, and γ (damping) is dissipation.

PREVIOUS PARAMETERS:
${JSON.stringify(prevParams, null, 2)}

EVALUATION FEEDBACK:
- Decision: ${evaluation.decision}
- Score: ${evaluation.score.toFixed(2)}
- Critiques: ${evaluation.critiques.join(', ') || 'None'}
- Suggestions: ${evaluation.suggestions.join(', ') || 'None'}

Based on this feedback, provide a new set of parameters as a JSON object to improve the score.
Apply the suggestions carefully. For example, if instability or high rotation speed was an issue, significantly reduce 'omega'. If energy drift was high, consider increasing 'damping'.
Your output MUST be a valid JSON object matching the requested schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    const newParams = JSON.parse(jsonText) as EquationParams;
    return newParams;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback to deterministic on API error
    return getDeterministicFallback(prevParams, evaluation);
  }
};
