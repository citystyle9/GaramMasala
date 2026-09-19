/**
 * @file types.ts
 * @description بنیادی ڈیٹا سٹرکچرز اور ٹائپ ڈیکلریشنز برائے مصالحہ آرگنائزر
 * Core TypeScript interfaces and type definitions for Spice Organizer.
 */

/**
 * انفرادی مصالحہ کی تفصیلات (Individual Spice Item)
 */
export interface SpiceItem {
  /** منفرد شناختی کوڈ (Unique Identifier) */
  id: string;
  /** اردو نام (Urdu Name) */
  name: string;
  /** انگریزی نام (English Name) */
  englishName: string;
  /** وزن گرام میں (Weight in Grams) */
  weightGrams: number;
  /** گھریلو مقدار کا ہندسہ یا عدد (Household Amount, e.g. "1", "2", "0.5") */
  householdAmount?: string;
  /** گھریلو پیمائش کا یونٹ (Household Unit: چمچ, کپ, عدد, وغیرہ) */
  householdUnit?: 'چمچ' | 'کپ' | 'عدد' | 'دیگر' | string;
  /** مشترکہ پیمائشی متن برائے برآمد اور ڈسپلے (Composite Household Measure string) */
  householdMeasure?: string;
}

/**
 * محفوظ شدہ ترکیب یا نسخہ (Saved Recipe Template)
 */
export interface RecipeTemplate {
  /** ٹیمپلیٹ کی منفرد آئی ڈی (Unique Template Identifier) */
  id: string;
  /** ٹیمپلیٹ کا نام (Template Name, e.g. "خاص بریانی مصالحہ") */
  name: string;
  /** تخلیق کی تاریخ (Creation Date string) */
  createdAt: string;
  /** مصالحہ جات کی مکمل فہرست (Snapshot of Spice Items) */
  spices: SpiceItem[];
}

