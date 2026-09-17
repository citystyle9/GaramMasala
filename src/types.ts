export interface SpiceItem {
  id: string;
  name: string;
  englishName: string;
  weightGrams: number;
  householdAmount?: string;
  householdUnit?: 'چمچ' | 'کپ' | 'عدد' | 'دیگر' | string;
  householdMeasure?: string;
  note?: string;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  createdAt: string;
  spices: SpiceItem[];
}

