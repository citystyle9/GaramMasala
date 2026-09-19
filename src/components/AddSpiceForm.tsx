/**
 * @file AddSpiceForm.tsx
 * @description نیا مصالحہ اور اختیاری پیمائش شامل کرنے کا فارم مع عام مصالحہ جات کی تجاویز
 * Component form allowing users to append new custom spices to the table,
 * along with optional English transliterations, weight, and household units.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SpiceItem } from '../types';

export interface AddSpiceFormProps {
  /** نیا مصالحہ شامل کرنے کا ایونٹ ہینڈلر */
  onAddSpice: (spice: Omit<SpiceItem, 'id'>) => void;
}

const COMMON_SUGGESTIONS = [
  { name: 'پیپلی (مگھاں)', englishName: 'Long Pepper (Pippali)', defaultGrams: 25, amount: '25', unit: 'عدد', measure: '25 عدد' },
  { name: 'سونٹھ (خشک ادرک)', englishName: 'Dry Ginger', defaultGrams: 10, amount: '1', unit: 'عدد', measure: '1 بڑا ٹکڑا (عدد)' },
  { name: 'کالا زیرہ (شاہی زیرہ)', englishName: 'Black Cumin / Caraway', defaultGrams: 10, amount: '1.5', unit: 'چمچ', measure: '1.5 چمچ' },
  { name: 'اجوائن', englishName: 'Carom Seeds (Ajwain)', defaultGrams: 5, amount: '1', unit: 'چمچ', measure: '1 چھوٹا چمچ' },
  { name: 'ہلدی پاؤڈر', englishName: 'Turmeric Powder', defaultGrams: 10, amount: '1', unit: 'چمچ', measure: '1 کھانے کا چمچ' },
  { name: 'کلونجی', englishName: 'Nigella Seeds (Kalonji)', defaultGrams: 5, amount: '1', unit: 'چمچ', measure: '1 چمچ' },
  { name: 'میتھی دانہ', englishName: 'Fenugreek Seeds', defaultGrams: 5, amount: '1', unit: 'چمچ', measure: '1 چمچ' },
  { name: 'انار دانہ', englishName: 'Dried Pomegranate Seeds', defaultGrams: 10, amount: '1', unit: 'چمچ', measure: '1 چمچ' },
  { name: 'ستار انیس (بادیان خطائی)', englishName: 'Star Anise', defaultGrams: 5, amount: '4', unit: 'عدد', measure: '4 عدد (پھول)' },
];

export const AddSpiceForm: React.FC<AddSpiceFormProps> = ({ onAddSpice }) => {
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAmount = amount.trim();
    const isBlank = !unit || unit === 'خالی' || !finalAmount;
    const finalUnit = isBlank ? '' : unit;
    const finalMeasure = isBlank ? undefined : `${finalAmount} ${finalUnit}`;

    onAddSpice({
      name: name.trim(),
      englishName: englishName.trim(),
      weightGrams: typeof weight === 'number' ? Math.max(0, weight) : 0,
      householdAmount: isBlank ? undefined : finalAmount,
      householdUnit: isBlank ? undefined : finalUnit,
      householdMeasure: finalMeasure,
    });

    setName('');
    setEnglishName('');
    setWeight('');
    setAmount('');
    setUnit('');
  };

  const handlePickSuggestion = (sugg: typeof COMMON_SUGGESTIONS[0]) => {
    onAddSpice({
      name: sugg.name,
      englishName: sugg.englishName,
      weightGrams: sugg.defaultGrams,
      householdAmount: sugg.amount,
      householdUnit: sugg.unit,
      householdMeasure: sugg.measure,
    });
  };

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 shadow-xs mt-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
          <h3 className="text-sm font-bold text-stone-800">
            نیا مصالحہ شامل کریں (+ Add New Spice)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
        >
          {isExpanded ? 'مشورے چھپائیں' : 'عام مصالحوں کی تجاویز دکھائیں'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        {/* Name input */}
        <div className="flex-1 min-w-[150px]">
          <input
            id="new-spice-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام (مثلاً: بادیان خطائی)"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
          />
        </div>

        {/* English Name input */}
        <div className="w-32 min-w-[110px]" dir="ltr">
          <input
            id="new-spice-eng-name"
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder="English Name"
            className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-left font-sans"
          />
        </div>

        {/* Weight input (in grams) */}
        <div className="w-24 flex items-center relative" dir="ltr">
          <input
            id="new-spice-weight"
            type="number"
            min="0"
            value={weight}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setWeight(isNaN(val) ? '' : val);
            }}
            placeholder="0"
            className="w-full px-3 py-2 text-sm font-mono text-center bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {weight !== '' && (
            <span className="absolute right-2 text-xs text-stone-400 font-sans pointer-events-none">
              g
            </span>
          )}
        </div>

        {/* Household amount & unit selector */}
        <div className="flex items-center gap-1 min-w-[180px]">
          <input
            id="new-spice-amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="مقدار"
            className="w-16 px-2 py-2 text-xs text-center font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-2 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="">یونٹ چنیں (اختیاری)</option>
            <option value="چمچ">چمچ</option>
            <option value="کپ">کپ</option>
            <option value="عدد">عدد</option>
            <option value="خالی">خالی رکھیں</option>
          </select>
        </div>

        {/* Add button */}
        <button
          id="submit-add-spice"
          type="submit"
          disabled={!name.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-lg transition-all shadow-xs cursor-pointer text-right min-w-[100px]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-bold">شامل کریں</span>
            <span className="text-[10px] text-amber-200 font-sans" dir="ltr">Add Spice</span>
          </div>
        </button>
      </form>

      {/* Suggested Spices Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <div className="text-xs text-stone-500 mb-2">فوری کلک کر کے فہرست میں شامل کریں:</div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SUGGESTIONS.map((sugg) => (
              <button
                key={sugg.name}
                type="button"
                onClick={() => handlePickSuggestion(sugg)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white hover:bg-amber-50 hover:text-amber-900 border border-stone-200 rounded-full text-stone-700 transition-colors cursor-pointer"
              >
                <span>+</span>
                <span>{sugg.name}</span>
                <span className="text-[10px] text-stone-400 font-mono">({sugg.defaultGrams}g)</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded">({sugg.measure})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
