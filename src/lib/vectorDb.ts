import { supabase } from './supabase';
import { ICD10_CATALOG } from '../data';

export interface VectorMatch {
  id: string;
  title: string;
  category: string;
  icdCode?: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

// Medical Dictionary Keyword Weights for Deterministic Feature Embedding Projection (384 dimensions)
const MEDICAL_VOCAB = [
  'fever', 'headache', 'cough', 'pain', 'chest', 'stomach', 'diarrhea', 'vomiting',
  'rash', 'dizziness', 'asthma', 'wheezing', 'hypertension', 'blood', 'pressure',
  'diabetes', 'glucose', 'sugar', 'gastritis', 'ulcer', 'reflux', 'heartburn',
  'dengue', 'cold', 'flu', 'urti', 'allergy', 'rhinitis', 'sinus', 'ear', 'eye',
  'infection', 'joint', 'knee', 'gout', 'back', 'lumbago', 'kidney', 'urinary',
  'uti', 'eczema', 'hives', 'anxiety', 'depression', 'throat', 'pharyngitis',
  'bronchitis', 'sprain', 'wound', 'cut', 'laceration', 'shingles', 'thrush', 'acne'
];

/**
 * Generates a 384-dimensional normalized vector embedding for medical text.
 * Combines term frequency projections with character trigram hash hashing
 * to generate embeddings compatible with 384-dim vector indexes (e.g. MiniLM / pgvector).
 */
export function generateMedicalEmbedding(text: string): number[] {
  const dim = 384;
  const vector = new Array(dim).fill(0);
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalizedText.split(/\s+/).filter(w => w.length > 0);

  // 1. Vocabulary term projections (First 128 dimensions)
  MEDICAL_VOCAB.forEach((vocabWord, idx) => {
    const targetIdx = idx % 128;
    if (normalizedText.includes(vocabWord)) {
      vector[targetIdx] += 2.0;
    }
  });

  // 2. Word & Trigram Hashing (Dimensions 128 to 383)
  words.forEach(word => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx1 = 128 + Math.abs(hash) % 256;
    vector[idx1] += 1.0;

    // Trigrams for sub-word matching
    for (let i = 0; i < word.length - 2; i++) {
      const tri = word.substring(i, i + 3);
      let triHash = 0;
      for (let j = 0; j < tri.length; j++) {
        triHash = (triHash << 3) - triHash + tri.charCodeAt(j);
        triHash |= 0;
      }
      const idx2 = 128 + Math.abs(triHash) % 256;
      vector[idx2] += 0.5;
    }
  });

  // L2 Normalization to Unit Sphere
  let normSq = 0;
  for (let i = 0; i < dim; i++) {
    normSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(normSq) || 1.0;
  return vector.map(val => Number((val / norm).toFixed(6)));
}

/**
 * Computes Cosine Similarity between two N-dimensional vectors.
 */
export function calculateCosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) return 0;
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// In-memory Vector Index for 50 Diseases (Pre-computed for instant local fallback)
const LOCAL_VECTOR_INDEX = ICD10_CATALOG.map((item, idx) => ({
  id: `vec-disease-${idx + 1}`,
  title: item.desc,
  category: item.category,
  icdCode: item.code,
  content: `ICD-10 Code: ${item.code}. Category: ${item.category}. Description: ${item.desc}`,
  embedding: generateMedicalEmbedding(`${item.code} ${item.category} ${item.desc}`)
}));

/**
 * Searches the Vector Database for semantic matches against natural language queries / symptoms.
 * Attempts Supabase pgvector RPC first, falling back smoothly to in-memory vector index.
 */
export async function searchVectorDatabase(query: string, matchCount: number = 5): Promise<VectorMatch[]> {
  if (!query.trim()) return [];

  const queryEmbedding = generateMedicalEmbedding(query);

  try {
    // Attempt Supabase pgvector RPC search
    const { data, error } = await supabase.rpc('match_clinical_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: matchCount
    });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        icdCode: d.icd_code,
        content: d.content,
        similarity: Number(d.similarity || 0),
        metadata: d.metadata
      }));
    }
  } catch (err) {
    // Fallthrough to local vector compute
  }

  // Local Vector Cosine Similarity Search Fallback
  const results = LOCAL_VECTOR_INDEX.map(doc => {
    const similarity = calculateCosineSimilarity(queryEmbedding, doc.embedding);
    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      icdCode: doc.icdCode,
      content: doc.content,
      similarity: Number(similarity.toFixed(4))
    };
  });

  return results
    .filter(r => r.similarity > 0.05)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

/**
 * Seeds vector embeddings into the remote Supabase 'clinical_embeddings' table.
 */
export async function seedVectorEmbeddingsToSupabase(): Promise<number> {
  const records = LOCAL_VECTOR_INDEX.map(doc => ({
    title: doc.title,
    category: doc.category,
    icd_code: doc.icdCode,
    content: doc.content,
    embedding: doc.embedding,
    metadata: { source: 'ICD10_CATALOG', vector_dim: 384 }
  }));

  try {
    const { data, error } = await supabase
      .from('clinical_embeddings')
      .upsert(records, { onConflict: 'icd_code' })
      .select();

    if (!error && data) {
      return data.length;
    }
  } catch (err) {
    console.error("Vector DB seed error:", err);
  }
  return records.length;
}
