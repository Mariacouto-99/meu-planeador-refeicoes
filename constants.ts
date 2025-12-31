
import { Ingredient } from './types';

export const BASE_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Café', category: 'Outros', kcalPer100: 1, proteinPer100: 0.1, unit: 'ml', isDefault: true },
  { id: '2', name: 'Laranja', category: 'Fruta', kcalPer100: 47, proteinPer100: 0.9, unit: 'unidade', isDefault: true },
  { id: '3', name: 'Banana', category: 'Fruta', kcalPer100: 89, proteinPer100: 1.1, unit: 'unidade', isDefault: true },
  { id: '4', name: 'Maçã', category: 'Fruta', kcalPer100: 52, proteinPer100: 0.3, unit: 'unidade', isDefault: true },
  { id: '5', name: 'Abacate', category: 'Fruta', kcalPer100: 160, proteinPer100: 2, unit: 'g', isDefault: true },
  { id: '6', name: 'Aveia', category: 'Secos', kcalPer100: 389, proteinPer100: 16.9, unit: 'g', isDefault: true },
  { id: '7', name: 'Iogurte SKYR', category: 'Laticínios', kcalPer100: 63, proteinPer100: 11, unit: 'g', isDefault: true },
  { id: '8', name: 'Nozes', category: 'Secos', kcalPer100: 654, proteinPer100: 15, unit: 'g', isDefault: true },
  { id: '9', name: 'Leite sem lactose', category: 'Laticínios', kcalPer100: 35, proteinPer100: 3.2, unit: 'ml', isDefault: true },
  { id: '10', name: 'Couscous', category: 'Secos', kcalPer100: 112, proteinPer100: 3.8, unit: 'g', isDefault: true },
  { id: '11', name: 'Quinoa', category: 'Secos', kcalPer100: 120, proteinPer100: 4.4, unit: 'g', isDefault: true },
  { id: '12', name: 'Feijão', category: 'Secos', kcalPer100: 139, proteinPer100: 9, unit: 'g', isDefault: true },
  { id: '13', name: 'Grão-de-bico', category: 'Secos', kcalPer100: 164, proteinPer100: 8.9, unit: 'g', isDefault: true },
  { id: '14', name: 'Atum', category: 'Proteína', kcalPer100: 116, proteinPer100: 26, unit: 'g', isDefault: true },
  { id: '15', name: 'Salmão', category: 'Proteína', kcalPer100: 208, proteinPer100: 20, unit: 'g', isDefault: true },
  { id: '16', name: 'Frango', category: 'Proteína', kcalPer100: 165, proteinPer100: 31, unit: 'g', isDefault: true },
];

export const TARGET_KCALS_WEEK = 10000;
export const TARGET_PROTEIN_DAY = 150;
export const TARGET_KCALS_DAY = Math.round(TARGET_KCALS_WEEK / 7);
