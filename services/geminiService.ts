
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, WeeklyPlan } from "../types";
import { TARGET_KCALS_DAY, TARGET_PROTEIN_DAY } from "../constants";

export const generateMealPlan = async (
  selectedIngredients: Ingredient[],
  daysCount: number = 7
): Promise<WeeklyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `Cria um plano de refeições detalhado para ${daysCount} dias. 
  Alvos diários: ~${TARGET_KCALS_DAY} kcal e ~${TARGET_PROTEIN_DAY}g de proteína.
  Ingredientes disponíveis: ${selectedIngredients.map(i => `${i.name} (Unidade: ${i.unit})`).join(', ')}.
  
  Regras cruciais de QUANTIDADES e UNIDADES:
  1. Para ingredientes com unidade 'unidade' (como Laranja, Banana, Maçã), a quantidade DEVE ser o número de peças (ex: 1, 0.5, 2). NÃO use gramas para estes.
  2. Para ingredientes com unidade 'g' ou 'ml', use a quantidade exata necessária (ex: 150g, 200ml).
  3. Seja realista: uma pessoa não come 50 bananas numa semana. Planeie quantidades normais para um ser humano.
  4. 5 refeições: Pequeno-almoço, Lanche da manhã, Almoço, Lanche da tarde, Jantar.
  5. Usa APENAS ingredientes da lista acima.
  6. Formato JSON: { "days": [ { "day": 1, "meals": [...] } ] }
  7. Atribua IDs únicos às refeições.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                meals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      name: { type: Type.STRING },
                      recipe: { type: Type.STRING },
                      kcal: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      ingredients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            ingredientName: { type: Type.STRING },
                            amount: { type: Type.NUMBER }
                          },
                          required: ["ingredientName", "amount"]
                        }
                      }
                    },
                    required: ["id", "type", "name", "recipe", "kcal", "protein", "ingredients"]
                  }
                }
              },
              required: ["day", "meals"]
            }
          }
        },
        required: ["days"]
      }
    }
  });

  const rawData = JSON.parse(response.text);
  
  const finalDays = rawData.days.map((d: any) => ({
    ...d,
    meals: d.meals.map((m: any) => ({
      ...m,
      ingredients: m.ingredients.map((ing: any) => {
        const found = selectedIngredients.find(si => si.name.toLowerCase().includes(ing.ingredientName.toLowerCase()));
        return {
          ingredientId: found ? found.id : 'unknown',
          amount: ing.amount
        };
      })
    }))
  }));

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    days: finalDays,
    totalKcal: finalDays.reduce((acc: number, d: any) => acc + d.meals.reduce((macc: number, m: any) => macc + m.kcal, 0), 0),
    totalProtein: finalDays.reduce((acc: number, d: any) => acc + d.meals.reduce((macc: number, m: any) => macc + m.protein, 0), 0)
  };
};
