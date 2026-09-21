/**
 * @file BackupRestoreModal.tsx
 * @description ڈیٹا بیک اپ برآمد کرنے (Export/Download) اور بحال کرنے (Import/Restore) کا ماڈل
 * Provides an offline-first JSON backup exporter and drag-and-drop / file selector restorer.
 * Ensures complete user data autonomy across devices, browser resets, or Firebase migrations.
 */

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  HardDrive, 
  X, 
  Check, 
  AlertCircle, 
  FileText, 
  RefreshCw,
  FolderArchive
} from 'lucide-react';
import { SpiceItem, RecipeTemplate, SpiceBackupData } from '../types';

export interface BackupRestoreModalProps {
  /** موجودہ فعال مصالحہ جات کی فہرست */
  spices: SpiceItem[];
  /** موجودہ فعال ٹیمپلیٹ کا نام */
  activeTemplateName: string | null;
  /** محفوظ شدہ ٹیمپلیٹس کی فہرست */
  templates: RecipeTemplate[];
  /** بیک اپ بحال ہونے پر کال بیک فنکشن */
  onRestore: (data: {
    spices: SpiceItem[];
    activeTemplateName?: string | null;
    templates: RecipeTemplate[];
    mergeTemplates: boolean;
  }) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  spices,
  activeTemplateName,
  templates,
  onRestore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<SpiceBackupData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mergeTemplates, setMergeTemplates] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export & Download Backup JSON
  const handleDownloadBackup = () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const backupData: SpiceBackupData = {
        appName: 'Spice Organizer',
        version: '1.0',
        exportedAt: now.toISOString(),
        activeTemplateName: activeTemplateName || 'معیاری مصالحہ مکسچر',
        spices,
        templates,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `masala-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      setErrorMessage('بیک اپ فائل تیار کرنے میں خرابی پیش آگئی ہے۔');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // 2. Parse uploaded JSON file
  const processFile = (file: File) => {
    setErrorMessage(null);
    setRestoreSuccess(false);

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setErrorMessage('براہ کرم درست JSON بیک اپ فائل منتخب کریں۔');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation: must contain at least spices array or templates array
        const hasSpices = Array.isArray(parsed.spices) && parsed.spices.length > 0;
        const hasTemplates = Array.isArray(parsed.templates);

        if (!hasSpices && !hasTemplates) {
          throw new Error('فائل میں مصالحہ جات یا ٹیمپلیٹس کا درست فارمیٹ موجود نہیں ہے۔');
        }

        const validBackup: SpiceBackupData = {
          appName: parsed.appName || 'Spice Organizer',
          version: parsed.version || '1.0',
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          activeTemplateName: parsed.activeTemplateName || null,
          spices: Array.isArray(parsed.spices) ? parsed.spices : [],
          templates: Array.isArray(parsed.templates) ? parsed.templates : [],
        };

        setParsedBackup(validBackup);
      } catch (err: any) {
        setErrorMessage(err.message || 'فائل پڑھنے میں ناکامی، فارمیٹ چیک کریں۔');
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input value so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // 3. Confirm & Apply Restore
  const handleConfirmRestore = () => {
    if (!parsedBackup) return;

    onRestore({
      spices: parsedBackup.spices,
      activeTemplateName: parsedBackup.activeTemplateName,
      templates: parsedBackup.templates,
      mergeTemplates,
    });

    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      setParsedBackup(null);
      setIsOpen(false);
    }, 1800);
  };

  return (
    <>
      {/* Header Action Trigger Button */}
      <button
        id="backup-restore-btn"
        type="button"
        onClick={() => {
          setIsOpen(true);
          setErrorMessage(null);
          setParsedBackup(null);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-all border border-stone-200 cursor-pointer text-right min-w-[95px] print:hidden"
        title="ڈیٹا کا بیک اپ ڈاؤن لوڈ کریں یا محفوظ شدہ فائل بحال کریں"
      >
        <FolderArchive className="w-4 h-4 text-stone-600 shrink-0" />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-bold text-stone-800">بیک اپ و بحالی</span>
          <span className="text-[10px] text-stone-500 font-sans" dir="ltr">Backup & Restore</span>
        </div>
      </button>

      {/* Backup & Restore Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-5 sm:p-6 text-right relative animate-in fade-in zoom-in-95 duration-150"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">ڈیٹا بیک اپ اور بحالی</h3>
                  <p className="text-xs text-stone-500">مکمل خود مختاری: ڈیٹا ڈاؤن لوڈ یا بحال کریں</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Feedback Box */}
            {restoreSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 justify-center font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ڈیٹا کامیابی کے ساتھ بحال (Restore) ہو گیا ہے!</span>
              </div>
            )}

            {/* Section 1: Export / Download Backup */}
            <div className="mb-5 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="text-right">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>1. ڈیٹا بیک اپ ڈاؤن لوڈ کریں</span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    تمام موجودہ مصالحہ جات ({spices.length}) اور محفوظ شدہ ٹیمپلیٹس ({templates.length}) کو اپنے کمپیوٹر یا موبائل میں فائل کی صورت محفوظ کریں۔
                  </p>
                </div>
              </div>

              <button
                id="download-backup-action-btn"
                type="button"
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>بیک اپ فائل ڈاؤن لوڈ ہو گئی!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>بیک اپ فائل ڈاؤن لوڈ کریں (JSON)</span>
                  </>
                )}
              </button>
            </div>

            {/* Section 2: Import / Restore Backup */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5 mb-1.5">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>2. پہلے سے محفوظ شدہ بیک اپ بحال کریں</span>
              </h4>
              <p className="text-xs text-stone-600 mb-3">
                اگر نیا سسٹم ہو یا پرانا ڈیٹا دوبارہ لانا ہو تو بیک اپ فائل یہاں اپ لوڈ کریں۔
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              {!parsedBackup ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-amber-600 bg-amber-100/50' 
                      : 'border-stone-300 hover:border-amber-500 bg-white'
                  }`}
                >
                  <FileText className="w-7 h-7 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-800">
                    بیک اپ فائل منتخب کریں یا یہاں ڈریگ کریں
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    صرف .json فائل سپورٹڈ ہے
                  </p>
                </div>
              ) : (
                /* File Selected Preview & Confirm */
                <div className="bg-white border border-amber-300 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      فائل تصدیق شدہ
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedBackup(null)}
                      className="text-[11px] text-stone-400 hover:text-red-600 cursor-pointer"
                    >
                      منسوخ
                    </button>
                  </div>

                  <div className="text-xs text-stone-700 space-y-1 mb-3">
                    <p>• مصالحہ جات: <span className="font-bold text-stone-900">{parsedBackup.spices.length} اجزاء</span></p>
                    <p>• ریسیپی ٹیمپلیٹس: <span className="font-bold text-stone-900">{parsedBackup.templates.length} ٹیمپلیٹس</span></p>
                    {parsedBackup.activeTemplateName && (
                      <p>• فعال نسخہ: <span className="font-bold text-amber-900">{parsedBackup.activeTemplateName}</span></p>
                    )}
                  </div>

                  {/* Merge or Replace Choice */}
                  <div className="mb-3 pt-2 border-t border-stone-100">
                    <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mergeTemplates}
                        onChange={(e) => setMergeTemplates(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 border-stone-300 w-3.5 h-3.5"
                      />
                      <span>موجودہ ٹیمپلیٹس کے ساتھ جوڑیں (اگر غیر منتخب کریں گے تو موجودہ ختم ہو کر صرف فائل والے آئیں گے)</span>
                    </label>
                  </div>

                  {/* Confirm Restore Button */}
                  <button
                    id="confirm-restore-action-btn"
                    type="button"
                    onClick={handleConfirmRestore}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>یہ ڈیٹا بحال کریں (Restore Now)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                بند کریں (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
