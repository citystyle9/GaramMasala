import React, { useState, useEffect } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Edit3, Check, X } from 'lucide-react';
import { SpiceItem } from '../types';

interface SpiceRowProps {
  spice: SpiceItem;
  index: number;
  totalSpices: number;
  totalWeight: number;
  onWeightChange: (id: string, newWeight: number) => void;
  onNameChange: (id: string, newName: string, newEnglishName?: string) => void;
  onHouseholdMeasureChange: (
    id: string,
    amount: string,
    unit: string,
    fullMeasure: string
  ) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDragStart: (e: React.DragEvent<HTMLTableRowElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLTableRowElement>, index: number) => void;
  onDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTableRowElement>, index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export const SpiceRow: React.FC<SpiceRowProps> = ({
  spice,
  index,
  totalSpices,
  totalWeight,
  onWeightChange,
  onNameChange,
  onHouseholdMeasureChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isDragOver,
}) => {
  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(spice.name);
  const [editedEngName, setEditedEngName] = useState(spice.englishName);

  // Household measure editing (صرف مقدار اور کپ / چمچ / عدد)
  const [isEditingMeasure, setIsEditingMeasure] = useState(false);
  const [amountVal, setAmountVal] = useState(spice.householdAmount || '');
  const [selectedUnit, setSelectedUnit] = useState(spice.householdUnit || 'چمچ');

  useEffect(() => {
    setEditedName(spice.name);
    setEditedEngName(spice.englishName || '');
  }, [spice.name, spice.englishName]);

  useEffect(() => {
    setAmountVal(spice.householdAmount || '');
    setSelectedUnit(spice.householdUnit || 'چمچ');
  }, [spice.householdAmount, spice.householdUnit]);

  // Grams and percentage are strictly linked to each other
  const percentage = totalWeight > 0 ? (spice.weightGrams / totalWeight) * 100 : 0;

  const handleSaveName = () => {
    if (editedName.trim()) {
      onNameChange(spice.id, editedName.trim(), editedEngName.trim());
    }
    setIsEditingName(false);
  };

  const handleSaveHouseholdMeasure = () => {
    const finalAmount = amountVal.trim();
    if (selectedUnit === 'خالی' || !finalAmount) {
      onHouseholdMeasureChange(spice.id, '', '', '');
      setIsEditingMeasure(false);
      return;
    }

    const finalUnit = selectedUnit || 'چمچ';
    const fullString = `${finalAmount} ${finalUnit}`;

    onHouseholdMeasureChange(spice.id, finalAmount, finalUnit, fullString);
    setIsEditingMeasure(false);
  };

  const handleClearHouseholdMeasure = () => {
    setAmountVal('');
    setSelectedUnit('خالی');
    onHouseholdMeasureChange(spice.id, '', '', '');
    setIsEditingMeasure(false);
  };

  // Determine display text for household measure
  const displayText = spice.householdAmount?.trim()
    ? `${spice.householdAmount.trim()} ${spice.householdUnit || 'چمچ'}`
    : spice.householdMeasure && spice.householdMeasure !== '—'
    ? spice.householdMeasure
    : '—';

  return (
    <tr
      id={`spice-row-${spice.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`group transition-colors border-b border-stone-200 select-none ${
        isDragging
          ? 'opacity-40 bg-amber-50/70 border-dashed border-2 border-amber-400'
          : isDragOver
          ? 'bg-amber-100/60 border-t-2 border-amber-500'
          : index % 2 === 0
          ? 'bg-white hover:bg-stone-50/80'
          : 'bg-stone-50/40 hover:bg-stone-100/70'
      }`}
    >
      {/* 1. Drag Handle & Serial Number (ترتیب و نمبر شمار) */}
      <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <div
            title="ماؤس سے پکڑ کر اوپر یا نیچے لے جائیں"
            className="cursor-grab active:cursor-grabbing p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-100/60 rounded-md transition-colors print:hidden"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-100 text-stone-700 font-semibold text-sm border border-stone-200 font-mono">
            {index + 1}
          </span>
          <div className="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity print:hidden">
            <button
              id={`move-up-${spice.id}`}
              type="button"
              disabled={index === 0}
              onClick={() => onMoveUp(index)}
              title="اوپر کریں"
              className="p-0.5 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-stone-400 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              id={`move-down-${spice.id}`}
              type="button"
              disabled={index === totalSpices - 1}
              onClick={() => onMoveDown(index)}
              title="نیچے کریں"
              className="p-0.5 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-stone-400 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </td>

      {/* 2. Spice Name (مصالحہ کا نام) */}
      <td className="py-3 px-4 text-right">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="مصالحہ کا نام"
              className="px-2.5 py-1 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 w-36 text-right"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <input
              type="text"
              value={editedEngName}
              onChange={(e) => setEditedEngName(e.target.value)}
              placeholder="English Name"
              dir="ltr"
              className="px-2.5 py-1 text-xs bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 w-32 text-left"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button
              type="button"
              onClick={handleSaveName}
              className="p-1 bg-amber-600 text-white rounded hover:bg-amber-700"
              title="محفوظ کریں"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between group/name gap-2">
            <div>
              <div className="font-semibold text-stone-900 text-base leading-tight">
                {spice.name}
              </div>
              {spice.englishName && (
                <div className="text-xs text-stone-500 font-sans tracking-wide mt-0.5" dir="ltr">
                  {spice.englishName}
                </div>
              )}
            </div>
            <button
              id={`edit-name-btn-${spice.id}`}
              type="button"
              onClick={() => setIsEditingName(true)}
              title="نام تبدیل کریں"
              className="opacity-0 group-hover/name:opacity-100 p-1 text-stone-400 hover:text-amber-700 transition-opacity cursor-pointer print:hidden"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>

      {/* 3. Quantity / Grams (مقدار گرام میں - یہ اور فیصد آپس میں لنک ہیں) */}
      <td className="py-3 px-4">
        {/* On screen: with + / - buttons and editable input */}
        <div className="flex items-center justify-center gap-1.5 print:hidden" dir="ltr">
          <button
            type="button"
            onClick={() => onWeightChange(spice.id, Math.max(0, spice.weightGrams - 5))}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-600 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 rounded border border-stone-200 transition-colors cursor-pointer"
            title="5 گرام کم کریں"
          >
            -
          </button>
          <div className="relative">
            <input
              id={`weight-input-${spice.id}`}
              type="number"
              min="0"
              step="1"
              value={spice.weightGrams === 0 ? '' : spice.weightGrams}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onWeightChange(spice.id, isNaN(val) ? 0 : Math.max(0, val));
              }}
              placeholder="0"
              className="w-20 px-2 py-1.5 text-center font-mono font-medium text-stone-900 bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm shadow-xs"
            />
            {spice.weightGrams > 0 && (
              <span className="absolute right-2 top-1.5 text-xs text-stone-400 pointer-events-none font-sans">
                g
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onWeightChange(spice.id, spice.weightGrams + 5)}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-600 bg-stone-100 hover:bg-amber-100 hover:text-amber-800 rounded border border-stone-200 transition-colors cursor-pointer"
            title="5 گرام بڑھائیں"
          >
            +
          </button>
        </div>

        {/* In Print / PDF: clean plain text only without buttons or input field overlay */}
        <div className="hidden print:block text-center font-mono text-sm font-semibold text-stone-900" dir="ltr">
          {spice.weightGrams > 0 ? `${spice.weightGrams} g` : '0 g'}
        </div>
      </td>

      {/* 4. Household Measure (گھریلو مقدار: کپ / چمچ / عدد / خالی) */}
      <td className="py-3 px-4 text-right">
        {isEditingMeasure ? (
          <div className="flex items-center gap-1.5 justify-start flex-wrap sm:flex-nowrap">
            {/* مقدار / گنتی کا خانہ */}
            <input
              type="text"
              value={amountVal}
              onChange={(e) => setAmountVal(e.target.value)}
              placeholder="مقدار"
              disabled={selectedUnit === 'خالی'}
              className={`w-16 px-2 py-1 text-xs bg-white border border-amber-400 rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs ${
                selectedUnit === 'خالی' ? 'opacity-40 bg-stone-100 cursor-not-allowed' : ''
              }`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveHouseholdMeasure()}
            />

            {/* یونٹ سلیکٹر: کپ / چمچ / عدد اور خالی */}
            <select
              value={selectedUnit}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedUnit(val);
                if (val === 'خالی') {
                  setAmountVal('');
                }
              }}
              className="px-2 py-1 text-xs bg-white border border-amber-400 rounded-md font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveHouseholdMeasure()}
            >
              <option value="چمچ">چمچ</option>
              <option value="کپ">کپ</option>
              <option value="عدد">عدد</option>
              <option value="خالی">خالی (کوئی نہیں)</option>
            </select>

            {/* خالی کرنے کا بٹن */}
            <button
              type="button"
              onClick={handleClearHouseholdMeasure}
              className="px-2 py-1 text-[11px] font-medium text-stone-500 hover:text-amber-900 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors cursor-pointer whitespace-nowrap"
              title="گھریلو مقدار خالی کریں"
            >
              خالی رکھیں
            </button>

            {/* محفوظ کریں بٹن */}
            <button
              type="button"
              onClick={handleSaveHouseholdMeasure}
              className="p-1 bg-amber-600 text-white rounded hover:bg-amber-700 shadow-xs cursor-pointer"
              title="محفوظ کریں"
            >
              <Check className="w-3.5 h-3.5" />
            </button>

            {/* منسوخ کریں بٹن */}
            <button
              type="button"
              onClick={() => setIsEditingMeasure(false)}
              className="p-1 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
              title="منسوخ کریں"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between group/measure gap-2">
            <span
              onClick={() => setIsEditingMeasure(true)}
              className={`text-sm cursor-pointer transition-colors ${
                displayText === '—'
                  ? 'text-stone-300 hover:text-amber-800 font-mono text-base px-1'
                  : 'font-medium text-stone-800 hover:text-amber-800'
              }`}
              title="کلک کر کے ترمیم کریں یا خالی رکھیں"
            >
              {displayText}
            </span>

            {/* ماؤس کرسر آنے پر ہی نظر آنے والا ایڈٹ آئیکن (جیسے نام والے کالم میں ہے) */}
            <button
              id={`edit-measure-btn-${spice.id}`}
              type="button"
              onClick={() => setIsEditingMeasure(true)}
              title="مقدار تبدیل کریں یا خالی رکھیں"
              className="opacity-0 group-hover/measure:opacity-100 p-1 text-stone-400 hover:text-amber-700 transition-opacity cursor-pointer print:hidden"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>

      {/* 5. Percentage Calculation (خودکار فی صد تناسب - صرف فیصد دکھاتا ہے) */}
      <td className="py-3 px-4">
        <div className="w-full max-w-[150px] mx-auto text-center">
          <div className="text-sm font-mono font-bold text-stone-800 mb-1">
            {percentage.toFixed(1)}%
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200 print:hidden">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
      </td>

      {/* 6. Delete Action (حذف) */}
      <td className="py-3 px-3 text-center print:hidden">
        <button
          id={`delete-spice-${spice.id}`}
          type="button"
          onClick={() => onDelete(spice.id)}
          title="حذف کریں"
          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
