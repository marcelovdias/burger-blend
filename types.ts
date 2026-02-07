
export interface MeatComponent {
  name: string;
  ratio: number; // Proporção relativa apenas entre as carnes (ex: 0.5 para 50%)
}

export interface BurgerSize {
  id: string;
  label: string;
  weight: number;
  description: string;
  icon: string;
}

export interface Recipe {
  id?: string;
  name: string;
  fatRatio: number; // Proporção de gordura no total do blend (ex: 0.2 para 20%)
  meats: MeatComponent[];
  unitWeight: number;
  grindMethod: string;
}

export interface CalculationResult {
  fat: number;
  meats: { name: string; weight: number; ratioInTotal: number }[];
  total: number;
  units: number;
}

export interface SuggestedBlend {
  id?: string;
  name: string;
  description: string;
  fatRatio: number;
  meats: MeatComponent[];
  sourceUrl?: string;
  citations?: { title: string; uri: string }[];
}
