import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import type { PlayerInventory } from './optimizer';
import type { MaterialKey } from '../constants';

// Material name patterns for matching OCR results
// These are keywords that appear in D4 material names
const MATERIAL_PATTERNS: Array<{
  patterns: string[];
  key: MaterialKey | 'stygian';
}> = [
  { patterns: ['betrayer', 'husk'], key: 'mat_husk' },
  { patterns: ['abhorrent', 'heart'], key: 'mat_abhorrent' },
  { patterns: ['pincushion', 'doll'], key: 'mat_doll' },
  { patterns: ['shard', 'agony'], key: 'mat_shard' },
  { patterns: ['judicator', 'mask'], key: 'mat_mask' },
  { patterns: ['exquisite', 'blood'], key: 'mat_blood' },
  { patterns: ['distilled', 'fear'], key: 'mat_fear' },
  { patterns: ['living', 'steel'], key: 'mat_steel' },
  { patterns: ['malignant'], key: 'mat_heart' },
  { patterns: ['stygian', 'stone'], key: 'stygian' },
];

export interface OCRResult {
  material: MaterialKey | 'stygian';
  count: number;
  confidence: number;
  rawText: string;
}

export interface OCRProcessResult {
  success: boolean;
  results: OCRResult[];
  error?: string;
}

let worker: Worker | null = null;
let isInitializing = false;

export async function initOCR(): Promise<void> {
  if (worker || isInitializing) return;

  isInitializing = true;
  try {
    worker = await createWorker('eng', 1, {
      // Load from CDN to avoid bundling language data
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
      langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-data@5/4.0.0/',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js',
    });
  } finally {
    isInitializing = false;
  }
}

export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

function matchMaterial(text: string): MaterialKey | 'stygian' | null {
  const lowerText = text.toLowerCase();

  for (const { patterns, key } of MATERIAL_PATTERNS) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return key;
      }
    }
  }

  return null;
}

function extractNumberFromText(text: string): number | null {
  // Look for numbers in the text
  const matches = text.match(/\d+/g);
  if (matches && matches.length > 0) {
    // Take the last number (usually the count is after the material name)
    const num = parseInt(matches[matches.length - 1], 10);
    if (!isNaN(num) && num >= 0 && num < 10000) {
      return num;
    }
  }
  return null;
}

export async function extractMaterialsFromImage(
  imageSource: string | HTMLCanvasElement | File
): Promise<OCRProcessResult> {
  try {
    await initOCR();

    if (!worker) {
      return { success: false, results: [], error: 'OCR engine not initialized' };
    }

    // Convert File to data URL if needed
    let source = imageSource;
    if (imageSource instanceof File) {
      source = await fileToDataURL(imageSource);
    }

    const { data } = await worker.recognize(source);

    const results: OCRResult[] = [];
    const seenMaterials = new Set<string>();

    // Split the recognized text into lines
    const lines = data.text.split('\n').filter(line => line.trim());

    // Process each line of recognized text
    for (const lineText of lines) {
      const text = lineText.trim();
      if (!text) continue;

      const material = matchMaterial(text);
      if (material && !seenMaterials.has(material)) {
        const count = extractNumberFromText(text);

        if (count !== null) {
          seenMaterials.add(material);
          results.push({
            material,
            count,
            confidence: data.confidence / 100,
            rawText: text,
          });
        }
      }
    }

    // Also try word-level analysis - split text into words
    const words = data.text.split(/\s+/).filter(word => word.trim());

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const material = matchMaterial(word);
      if (material && !seenMaterials.has(material)) {
        // Look for a number near this word
        const nearbyWords = words.slice(
          Math.max(0, i - 2),
          Math.min(words.length, i + 3)
        );

        for (const nearby of nearbyWords) {
          const count = extractNumberFromText(nearby);
          if (count !== null) {
            seenMaterials.add(material);
            results.push({
              material,
              count,
              confidence: data.confidence / 100,
              rawText: `${word} ${nearby}`,
            });
            break;
          }
        }
      }
    }

    return {
      success: results.length > 0,
      results,
      error: results.length === 0 ? 'No materials found in image' : undefined,
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

export function ocrResultsToInventory(results: OCRResult[]): Partial<PlayerInventory> {
  const inventory: Partial<PlayerInventory> = {};

  for (const result of results) {
    inventory[result.material] = result.count;
  }

  return inventory;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Preload OCR engine in the background
export function preloadOCR(): void {
  // Don't block, just start loading in background
  initOCR().catch(console.warn);
}
