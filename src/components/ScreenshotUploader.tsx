import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { extractMaterialsFromImage, ocrResultsToInventory, preloadOCR } from '../lib/ocr';
import type { OCRResult } from '../lib/ocr';
import type { PlayerInventory } from '../lib/optimizer';
import type { TranslateFunction } from '../hooks/useLanguage';
import { MATERIAL_ICONS } from '../constants';

interface ScreenshotUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (inventory: Partial<PlayerInventory>) => void;
  playerIndex: number;
  playerName: string;
  t: TranslateFunction;
}

export function ScreenshotUploader({
  isOpen,
  onClose,
  onApply,
  playerIndex,
  playerName,
  t,
}: ScreenshotUploaderProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [editedResults, setEditedResults] = useState<Record<string, number>>({});

  // Preload OCR engine when component mounts
  useEffect(() => {
    if (isOpen) {
      preloadOCR();
    }
  }, [isOpen]);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle paste from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            await processFile(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setImagePreview(null);
    setIsProcessing(false);
    setError(null);
    setResults([]);
    setEditedResults({});
    onClose();
  }, [onClose]);

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    setIsProcessing(true);
    setError(null);
    setResults([]);

    const result = await extractMaterialsFromImage(file);

    setIsProcessing(false);

    if (result.success) {
      setResults(result.results);
      // Initialize edited results with OCR results
      const initial: Record<string, number> = {};
      for (const r of result.results) {
        initial[r.material] = r.count;
      }
      setEditedResults(initial);
    } else {
      setError(result.error || t('ocr_error_processing'));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleResultChange = (material: string, value: number) => {
    setEditedResults((prev) => ({
      ...prev,
      [material]: Math.max(0, value),
    }));
  };

  const handleApply = () => {
    const inventory = ocrResultsToInventory(
      Object.entries(editedResults).map(([material, count]) => ({
        material: material as OCRResult['material'],
        count,
        confidence: 1,
        rawText: '',
      }))
    );
    onApply(inventory);
    handleClose();
  };

  const getMaterialName = (key: string): string => {
    return t(key) || key;
  };

  const getMaterialIcon = (key: string): string => {
    const icons = MATERIAL_ICONS as Record<string, string>;
    return icons[key] || '';
  };

  if (!isOpen) return null;

  const displayName = playerName || `${t('lbl_player')} ${playerIndex + 1}`;

  return (
    <div
      className="screenshot-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="screenshot-title"
    >
      <div
        ref={dialogRef}
        className="screenshot-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="screenshot-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 id="screenshot-title" className="screenshot-title">
          <Camera size={20} />
          {t('ocr_title')} - {displayName}
        </h2>

        {!imagePreview && !isProcessing && (
          <div
            className="screenshot-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={40} strokeWidth={1} />
            <p className="dropzone-text">{t('ocr_drop_hint')}</p>
            <p className="dropzone-hint">{t('ocr_paste_hint')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>
        )}

        {isProcessing && (
          <div className="screenshot-processing">
            <Loader2 size={40} className="spinner" />
            <p>{t('ocr_processing')}</p>
          </div>
        )}

        {error && (
          <div className="screenshot-error">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null);
                setImagePreview(null);
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {imagePreview && !isProcessing && !error && (
          <div className="screenshot-preview">
            <img src={imagePreview} alt="Screenshot preview" />
          </div>
        )}

        {results.length > 0 && !isProcessing && (
          <div className="screenshot-results">
            <h3 className="results-title">{t('ocr_detected')}</h3>
            <p className="results-hint">{t('ocr_edit_hint')}</p>

            <div className="results-grid">
              {Object.entries(editedResults).map(([material, count]) => {
                const result = results.find((r) => r.material === material);
                const confidence = result?.confidence ?? 1;

                return (
                  <div key={material} className="result-row">
                    <div className="result-material">
                      <img
                        src={getMaterialIcon(material)}
                        alt=""
                        className="result-icon"
                      />
                      <span className="result-name">
                        {getMaterialName(material)}
                      </span>
                    </div>
                    <div className="result-value">
                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) =>
                          handleResultChange(
                            material,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="result-input"
                      />
                      <span
                        className={`result-confidence ${
                          confidence < 0.7 ? 'low' : confidence < 0.9 ? 'medium' : 'high'
                        }`}
                      >
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="screenshot-actions">
              <button className="action-btn action-btn--primary" onClick={handleApply}>
                {t('ocr_confirm')}
              </button>
              <button className="action-btn action-btn--cancel" onClick={handleClose}>
                {t('ocr_cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .screenshot-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 7, 10, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: dialogFadeIn 0.2s ease-out;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }

        .screenshot-dialog {
          position: relative;
          background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-secondary) 100%);
          border: 1px solid var(--color-border);
          padding: 1.5rem;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: dialogSlideIn 0.25s ease-out;
          box-shadow: var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.5);
        }

        .screenshot-dialog::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/texture-demonic.png') center/300px repeat;
          opacity: 0.03;
          pointer-events: none;
        }

        .screenshot-dialog::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-bronze), transparent);
          pointer-events: none;
        }

        .screenshot-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          transition: color 0.15s;
          z-index: 10;
        }

        .screenshot-close:hover {
          color: var(--color-gold);
        }

        .screenshot-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1.25rem;
          color: var(--color-gold);
          position: relative;
        }

        .screenshot-dropzone {
          border: 2px dashed var(--color-border);
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .screenshot-dropzone:hover {
          border-color: var(--color-bronze);
          background: rgba(201, 162, 39, 0.03);
        }

        .screenshot-dropzone svg {
          color: var(--color-text-muted);
          margin-bottom: 1rem;
        }

        .dropzone-text {
          color: var(--color-text-secondary);
          margin: 0 0 0.5rem;
          font-size: 0.9375rem;
        }

        .dropzone-hint {
          color: var(--color-text-muted);
          margin: 0;
          font-size: 0.8125rem;
        }

        .file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .screenshot-processing {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem;
          color: var(--color-text-secondary);
        }

        .spinner {
          animation: spin 1s linear infinite;
          color: var(--color-gold);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .screenshot-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          color: #fca5a5;
        }

        .retry-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .retry-btn:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-primary);
        }

        .screenshot-preview {
          margin-bottom: 1rem;
          border: 1px solid var(--color-border);
          max-height: 200px;
          overflow: hidden;
          position: relative;
        }

        .screenshot-preview img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
        }

        .screenshot-results {
          position: relative;
        }

        .results-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: var(--color-text-primary);
        }

        .results-hint {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin: 0 0 1rem;
        }

        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--color-border-subtle);
        }

        .result-material {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-icon {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .result-name {
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .result-value {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-input {
          width: 60px;
          padding: 0.25rem 0.5rem;
          background: var(--color-bg-void);
          border: 1px solid var(--color-border);
          color: var(--color-text-primary);
          text-align: center;
          font-size: 0.875rem;
        }

        .result-input:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .result-confidence {
          font-size: 0.6875rem;
          padding: 0.125rem 0.375rem;
          border-radius: 2px;
        }

        .result-confidence.high {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
        }

        .result-confidence.medium {
          background: rgba(234, 179, 8, 0.2);
          color: #fde047;
        }

        .result-confidence.low {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .screenshot-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .action-btn {
          padding: 0.5rem 1.25rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 100px;
        }

        .action-btn--primary {
          background: linear-gradient(180deg, var(--color-gold) 0%, var(--color-gold-dark) 100%);
          border-color: var(--color-gold);
          color: var(--color-bg-primary);
        }

        .action-btn--primary:hover {
          background: linear-gradient(180deg, #d4af37 0%, var(--color-gold) 100%);
        }

        .action-btn--cancel {
          background: var(--color-bg-void);
          border-color: var(--color-border);
          color: var(--color-text-secondary);
        }

        .action-btn--cancel:hover {
          border-color: var(--color-bronze);
          color: var(--color-text-primary);
        }

        @media (max-width: 480px) {
          .screenshot-dialog {
            padding: 1rem;
            max-height: 85vh;
          }

          .screenshot-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
