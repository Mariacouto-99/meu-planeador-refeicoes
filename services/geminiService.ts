
import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient, WeeklyPlan } from "../types";
import { TARGET_KCALS_DAY, TARGET_PROTEIN_DAY } from "../constants";

export const identifyFood = async (base64Image: string): Promise<Partial<Ingredient>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = "Identifica este alimento. Retorna apenas um JSON com as propriedades: name (nome em português), category (apenas uma destas: Fruta, Proteína, Secos, Laticínios, Outros), kcalPer100 (estimativa de calorias por 100g ou unidade), proteinPer100 (estimativa de proteína por 100g ou unidade), unit (deve ser 'g', 'ml' ou 'unidade'). Se for uma peça inteira como fruta, usa 'unidade'.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          kcalPer100: { type: Type.NUMBER },
          proteinPer100: { type: Type.NUMBER },
          unit: { type: Type.STRING }
        },
        required: ["name", "category", "kcalPer100", "proteinPer100", "unit"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateMealPlan = async (
  selectedIngredients: Ingredient[],
  daysCount: number = 7
): Promise<WeeklyPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `Cria um plano de refeições para ${daysCount} dias. 
  Meta Diária: ~${TARGET_KCALS_DAY} kcal e ~${TARGET_PROTEIN_DAY}g de proteína.
  
  REGRAS ABSOLUTAS:
  1. Usa EXCLUSIVAMENTE os ingredientes desta lista: ${selectedIngredients.map(i => `${i.name} (Unidade: ${i.unit})`).join(', ')}. NÃO adiciones temperos, óleos ou complementos que não estejam na lista.
  2. Distribuição Calórica Realista: O almoço e o jantar devem ser as refeições principais (mais calóricas). Pequeno-almoço e lanches devem ser mais leves. O importante é o total do dia bater ${TARGET_KCALS_DAY} kcal.
  3. Receitas: Descreve como preparar usando apenas os itens listados.
  4. Quantidades: Respeita as unidades (se unit=unidade, usa números inteiros ou decimais pequenos; se unit=g, usa gramas).
  5. Formato JSON: { "days": [ { "day": 1, "meals": [...] } ] }`;

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
