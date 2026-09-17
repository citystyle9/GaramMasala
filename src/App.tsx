import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Scale, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Printer, 
  ArrowUpDown,
  Flame,
  Info
} from 'lucide-react';
import { SpiceItem, RecipeTemplate } from './types';
import { INITIAL_GARAM_MASALA_SPICES } from './defaultSpices';
import { SpiceRow } from './components/SpiceRow';
import { AddSpiceForm } from './components/AddSpiceForm';
import { TemplateManager } from './components/TemplateManager';

const LOCAL_STORAGE_KEY = 'garam_masala_spices_v6';
const TEMPLATES_STORAGE_KEY = 'garam_masala_templates_v1';

export default function App() {
  const [spices, setSpices] = useState<SpiceItem[]>(() => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_KEY) ||
        localStorage.getItem('garam_masala_spices_v5') ||
        localStorage.getItem('garam_masala_spices_v4');
      if (saved) {
        let parsed: SpiceItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if پیپلی (مگھاں) is present
          const hasPipli = parsed.some(
            (item) =>
              item.name.includes('پیپلی') ||
              item.name.includes('پپلی') ||
              item.name.includes('مگھاں') ||
              (item.englishName && item.englishName.toLowerCase().includes('pippali'))
          );

          if (!hasPipli) {
            // Append پیپلی (مگھاں) to the list
            parsed.push({
              id: 'spice-14',
              name: 'پیپلی (مگھاں)',
              englishName: 'Long Pepper (Pippali / Maghan)',
              weightGrams: 25,
              householdAmount: '25',
              householdUnit: 'عدد',
              householdMeasure: '25 عدد',
            });
          } else {
            // Ensure spelling is پیپلی (مگھاں)
            parsed = parsed.map((item) =>
              item.name.includes('پپلی') || item.name.includes('مگھاں')
                ? { ...item, name: 'پیپلی (مگھاں)' }
                : item
            );
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_GARAM_MASALA_SPICES;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Saved templates state
  const [templates, setTemplates] = useState<RecipeTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Save templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch {
      // ignore
    }
  }, [templates]);

  // Save current spices as a new template
  const handleSaveTemplate = (name: string) => {
    const newTemplate: RecipeTemplate = {
      id: `template-${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString('ur-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      spices: JSON.parse(JSON.stringify(spices)),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
  };

  // Load a saved template
  const handleLoadTemplate = (template: RecipeTemplate) => {
    setSpices(JSON.parse(JSON.stringify(template.spices)));
  };

  // Delete a saved template
  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(spices));
    } catch {
      // ignore
    }
  }, [spices]);

  // Calculate total grams
  const totalWeight = spices.reduce((sum, item) => sum + (Number(item.weightGrams) || 0), 0);

  // Reorder via Drag and Drop
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // set small drag image or data
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    // optional reset
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...spices];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setSpices(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move up/down single row
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...spices];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSpices(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === spices.length - 1) return;
    const updated = [...spices];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSpices(updated);
  };

  // Weight updates
  const handleWeightChange = (id: string, newWeight: number) => {
    setSpices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, weightGrams: newWeight } : item))
    );
  };

  // Name updates
  const handleNameChange = (id: string, newName: string, newEnglishName?: string) => {
    setSpices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: newName,
              englishName: newEnglishName !== undefined ? newEnglishName : item.englishName,
            }
          : item
      )
    );
  };

  // Household measure updates (کپ، چمچ، عدد یا تحریر)
  const handleHouseholdMeasureChange = (
    id: string,
    amount: string,
    unit: string,
    fullMeasure: string
  ) => {
    setSpices((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              householdAmount: amount,
              householdUnit: unit,
              householdMeasure: fullMeasure,
            }
          : item
      )
    );
  };

  // Delete spice
  const handleDelete = (id: string) => {
    setSpices((prev) => prev.filter((item) => item.id !== id));
  };

  // Add new spice
  const handleAddSpice = (spiceData: Omit<SpiceItem, 'id'>) => {
    const newSpice: SpiceItem = {
      ...spiceData,
      id: `spice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setSpices((prev) => [...prev, newSpice]);
  };

  // Reset all values to zero and empty
  const handleResetToDefault = () => {
    if (window.confirm('کیا آپ تمام مصالحوں کی مقداریں (گرام اور گھریلو پیمائش) صفر (0) کرنا چاہتے ہیں؟')) {
      setSpices((prev) =>
        prev.map((item) => ({
          ...item,
          weightGrams: 0,
          householdAmount: '',
          householdUnit: '',
          householdMeasure: '',
        }))
      );
    }
  };

  // Copy recipe summary
  const handleCopySummary = () => {
    const textLines = [
      '--- گرم مصالحہ نسخہ و تناسب (Garam Masala Recipe & Ratio) ---',
      `کل وزن: ${totalWeight} گرام | کل اجزاء: ${spices.length}`,
      '-------------------------------------------------------',
      ...spices.map((s, idx) => {
        const pct = totalWeight > 0 ? ((s.weightGrams / totalWeight) * 100).toFixed(1) : '0.0';
        const measure = s.householdMeasure ? ` [${s.householdMeasure}]` : '';
        return `${idx + 1}. ${s.name} (${s.englishName || ''}) : ${s.weightGrams}g (${pct}%)${measure}`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-16 pt-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Header Card */}
        <header className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-7 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 shadow-xs border border-amber-200">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <span>گرم مصالحہ آرگنائزر</span>
                  <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-sans" dir="ltr">
                    Spice Organizer
                  </span>
                </h1>
                <p className="text-stone-600 text-sm mt-1 leading-relaxed">
                  ماؤس سے پکڑ کر اوپر نیچے ترتیب دیں، ہر مصالحے کی مقدار (گرام) درج کریں اور کل اجزاء میں خودکار فی صد تناسب دیکھیں۔
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-center flex-wrap sm:flex-nowrap print:hidden">
              <TemplateManager
                currentSpices={spices}
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />

              <button
                id="copy-recipe-btn"
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                title="فہرست کاپی کریں"
              >
                {copiedMessage ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'کاپی ہو گیا!' : 'کاپی کریں'}</span>
              </button>

              <button
                id="print-recipe-btn"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                title="پرنٹ کریں"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>پرنٹ</span>
              </button>

              <button
                id="reset-spices-btn"
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                title="معیاری ترکیب بحال کریں"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بحال کریں</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-100">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>کل وزن (Total)</span>
                <Scale className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900" dir="ltr">
                {totalWeight} <span className="text-xs font-normal text-stone-500 font-sans">گرام</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>کل مصالحے (Items)</span>
                <Layers className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {spices.length}
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>کل تناسب (Ratio)</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-xl font-bold font-mono text-stone-900" dir="ltr">
                {totalWeight > 0 ? '100%' : '0%'}
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 print:hidden">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                <span>ترتیب کا طریقہ</span>
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="text-xs font-medium text-amber-900 mt-1">
                ماؤس سے پکڑ کر گھسیٹیں
              </div>
            </div>
          </div>

          {/* Visual Distribution Strip */}
          {totalWeight > 0 && (
            <div className="mt-5 print:hidden">
              <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                <span>مصالحوں کا تناسبی جائزہ (Visual Blend Distribution)</span>
                <span className="font-mono text-[11px] text-stone-400">100% تناسب</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex border border-stone-200">
                {spices.map((spice, idx) => {
                  const pct = (spice.weightGrams / totalWeight) * 100;
                  if (pct <= 0) return null;
                  const paletteColors = [
                    'bg-amber-600',
                    'bg-orange-600',
                    'bg-yellow-600',
                    'bg-stone-700',
                    'bg-amber-700',
                    'bg-orange-700',
                    'bg-emerald-700',
                    'bg-lime-700',
                    'bg-red-700',
                    'bg-amber-800',
                    'bg-stone-600',
                    'bg-teal-700',
                  ];
                  const color = paletteColors[idx % paletteColors.length];
                  return (
                    <div
                      key={spice.id}
                      className={`${color} h-full transition-all duration-300 relative group cursor-pointer`}
                      style={{ width: `${pct}%` }}
                      title={`${spice.name}: ${spice.weightGrams}g (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Drag Instruction Banner */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs mb-4 print:hidden">
          <Info className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            <strong>رہنمائی:</strong> کسی بھی مصالحے کو اوپر یا نیچے کرنے کے لیے بائیں جانب بنے ہینڈل (⋮⋮) کو ماؤس سے پکڑ کر اوپر یا نیچے ڈریگ کریں۔ آپ تیر والے بٹن سے بھی ترتیب بدل سکتے ہیں۔
          </span>
        </div>

        {/* Main Table Card */}
        <main className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-100/90 text-stone-700 text-xs font-bold border-b border-stone-200 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-3 sm:px-4 text-center w-28">
                    ترتیب و نمبر
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    مصالحہ کا نام
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-36">
                    مقدار (گرام میں)
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-right min-w-[170px]">
                    گھریلو مقدار (کپ / چمچ / عدد)
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-44">
                    خودکار فی صد تناسب (%)
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center w-14 print:hidden">
                    حذف
                  </th>
                </tr>
              </thead>
              <tbody>
                {spices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      کوئی مصالحہ موجود نہیں ہے۔ نیچے دیئے گئے فارم سے نیا مصالحہ شامل کریں یا "بحال کریں" پر کلک کریں۔
                    </td>
                  </tr>
                ) : (
                  spices.map((spice, index) => (
                    <SpiceRow
                      key={spice.id}
                      spice={spice}
                      index={index}
                      totalSpices={spices.length}
                      totalWeight={totalWeight}
                      onWeightChange={handleWeightChange}
                      onNameChange={handleNameChange}
                      onHouseholdMeasureChange={handleHouseholdMeasureChange}
                      onDelete={handleDelete}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      isDragging={draggedIndex === index}
                      isDragOver={dragOverIndex === index && draggedIndex !== index}
                    />
                  ))
                )}
              </tbody>
              {spices.length > 0 && (
                <tfoot>
                  <tr className="bg-stone-100/80 font-bold text-stone-900 border-t-2 border-stone-200">
                    <td className="py-3.5 px-4 text-center text-xs text-stone-500">
                      ٹوٹل
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      مجموعی گرم مصالحہ مکسچر ({spices.length} اجزاء)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-base" dir="ltr">
                      {totalWeight} <span className="text-xs font-normal text-stone-500 font-sans">گرام</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-xs text-stone-500 font-normal">
                      گھریلو استعمال کا تناسب
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-base text-amber-900">
                      {totalWeight > 0 ? '100.0%' : '0.0%'}
                    </td>
                    <td className="py-3.5 px-3 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </main>

        {/* Add Spice Form Section */}
        <section aria-label="نیا مصالحہ شامل کرنے کا فارم" className="print:hidden">
          <AddSpiceForm onAddSpice={handleAddSpice} />
        </section>

      </div>
    </div>
  );
}
