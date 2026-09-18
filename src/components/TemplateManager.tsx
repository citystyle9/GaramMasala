import React, { useState } from 'react';
import { Bookmark, FolderOpen, Plus, Trash2, Check, X, Clock } from 'lucide-react';
import { SpiceItem, RecipeTemplate } from '../types';

interface TemplateManagerProps {
  currentSpices: SpiceItem[];
  templates: RecipeTemplate[];
  activeTemplateName?: string | null;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (template: RecipeTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentSpices,
  templates,
  activeTemplateName,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleSave = () => {
    const trimmed = templateName.trim();
    if (!trimmed) return;
    onSaveTemplate(trimmed);
    setTemplateName('');
    setIsSaving(false);
    showNotification(`ٹیمپلیٹ "${trimmed}" محفوظ ہو گیا!`);
  };

  const handleLoad = (tpl: RecipeTemplate) => {
    onLoadTemplate(tpl);
    setIsOpen(false);
    showNotification(`ٹیمپلیٹ "${tpl.name}" لوڈ ہو گیا!`);
  };

  const handleDelete = (e: React.MouseEvent, tpl: RecipeTemplate) => {
    e.stopPropagation();
    if (window.confirm(`کیا آپ "${tpl.name}" ٹیمپلیٹ حذف کرنا چاہتے ہیں؟`)) {
      onDeleteTemplate(tpl.id);
      showNotification(`ٹیمپلیٹ حذف کر دیا گیا!`);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        id="open-templates-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-xs cursor-pointer text-right"
        title="ٹیمپلیٹ محفوظ کریں یا محفوظ شدہ نسخہ لوڈ کریں"
      >
        <Bookmark className="w-4 h-4 shrink-0 text-amber-200" />
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold">ٹیمپلیٹس</span>
            {templates.length > 0 && (
              <span className="bg-amber-800/90 text-amber-100 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                {templates.length}
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-200 font-sans tracking-wide" dir="ltr">Templates</span>
        </div>
      </button>

      {/* Popover / Modal Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 text-right">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-600 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-sm">
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span>محفوظ شدہ ٹیمپلیٹس (Templates)</span>
            </div>
          </div>

          {/* Quick Notification */}
          {notification && (
            <div className="mb-3 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

          {/* Save Current as Template */}
          <div className="mb-4 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
            {!isSaving ? (
              <button
                type="button"
                onClick={() => {
                  setIsSaving(true);
                  setTemplateName(`گرم مصالحہ نسخہ ${templates.length + 1}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>موجودہ ڈیٹا کو نئے ٹیمپلیٹ کے طور پر محفوظ کریں</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-stone-700">
                  ٹیمپلیٹ کا نام درج کریں:
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    title="محفوظ کریں"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="مثلاً: خاص بریانی مصالحہ"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <button
                    type="button"
                    onClick={() => setIsSaving(false)}
                    className="p-2 text-stone-400 hover:text-stone-600 rounded-lg shrink-0 cursor-pointer"
                    title="منسوخ کریں"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Templates List */}
          <div>
            <div className="text-xs font-semibold text-stone-500 mb-2">
              محفوظ نسخے ({templates.length}):
            </div>

            {templates.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                ابھی تک کوئی ٹیمپلیٹ محفوظ نہیں کیا گیا۔ اوپر دیے گئے بٹن سے موجودہ نسخہ محفوظ کریں۔
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {templates.map((tpl) => {
                  const tplWeight = tpl.spices.reduce((sum, s) => sum + (Number(s.weightGrams) || 0), 0);
                  const isActive = activeTemplateName === tpl.name;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleLoad(tpl)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-amber-500 bg-amber-50/90 ring-1 ring-amber-500'
                          : 'border-stone-200 hover:border-amber-400 bg-stone-50/60 hover:bg-amber-50/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, tpl)}
                        className="p-1 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-70 group-hover:opacity-100 cursor-pointer shrink-0"
                        title="ٹیمپلیٹ حذف کریں"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1.5">
                          {isActive && (
                            <span className="text-[10px] bg-amber-600 text-white font-medium px-1.5 py-0.2 rounded-md">
                              فعال
                            </span>
                          )}
                          <span className="font-semibold text-stone-900 text-xs group-hover:text-amber-900">
                            {tpl.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span>{tpl.spices.length} اجزاء ({tplWeight} گرام)</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {tpl.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
