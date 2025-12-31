
export type Category = 'Fruta' | 'Proteína' | 'Secos' | 'Laticínios' | 'Outros';

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  kcalPer100: number; // or per unit
  proteinPer100: number; // or per unit
  unit: 'g' | 'ml' | 'unidade';
  isDefault?: boolean;
}

export interface Meal {
  id: string;
  type: 'Pequeno-almoço' | 'Lanche da manhã' | 'Almoço' | 'Lanche da tarde' | 'Jantar';
  name: string;
  recipe: string;
  kcal: number;
  protein: number;
  ingredients: {
    ingredientId: string;
    amount: number;
  }[];
}

export interface DailyPlan {
  day: number;
  meals: Meal[];
}

export interface WeeklyPlan {
  id: string;
  date: string;
  days: DailyPlan[];
  totalKcal: number;
  totalProtein: number;
}

export interface ShoppingItem {
  ingredient: Ingredient;
  totalAmount: number;
  totalKcal: number;
  totalProtein: number;
}
