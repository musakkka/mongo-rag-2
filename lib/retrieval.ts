import { Collection, ObjectId } from 'mongodb';
import { getCollection } from './mongodb';
import { generateEmbedding, prepareTextForEmbedding } from './embeddings';
import { Document } from './embeddings';
import { getAllDocuments } from './storage';

export interface SearchResult extends Document {
  _id?: any;
  score?: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

/**
 * Perform vector similarity search using manual cosine similarity calculation
 */
export async function vectorSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const collection = await getCollection('documents');
    const { limit = 5, threshold = 0.7 } = options;
    
    // Generate embedding for the query
    const { embedding } = await generateEmbedding(query);
    
    // Get all documents with embeddings
    const allDocs = await collection.find({ 
      embedding: { $exists: true, $ne: null } 
    }).toArray();
    
    if (allDocs.length === 0) {
      console.log('🔍 No documents with embeddings found');
      return [];
    }
    
    // Calculate cosine similarity for each document
    const documentsWithScores = allDocs.map(doc => {
      const similarity = cosineSimilarity(embedding, doc.embedding);
      return {
        ...doc,
        score: similarity,
      } as any;
    });
    
    // Filter by threshold and sort by score
    const results = documentsWithScores
      .filter(doc => doc.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(doc => ({
        title: doc.title || '',
        content: doc.content || '',
        metadata: doc.metadata || {},
        score: doc.score,
        createdAt: doc.createdAt,
      }));
    
    console.log(`🔍 Vector search found ${results.length} results for query: "${query}"`);
    
    return results as SearchResult[];
  } catch (error) {
    console.error('Error performing vector search:', error);
    throw new Error('Failed to perform vector search');
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback text search using MongoDB's text search
 */
export async function textSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const collection = await getCollection('documents');
    const { limit = 5 } = options;
    
    // Create text index if it doesn't exist (this should be done in MongoDB)
    // db.documents.createIndex({ "title": "text", "content": "text" })
    
    const results = await collection
      .find({ $text: { $search: query } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray();
    
    console.log(`🔍 Text search found ${results.length} results for query: "${query}"`);
    
    return results.map(doc => ({
      ...doc,
      score: doc.score,
    })) as SearchResult[];
  } catch (error) {
    console.error('Error performing text search:', error);
    throw new Error('Failed to perform search');
  }
}

/**
 * Hybrid search combining vector and text search
 */
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 5 } = options;
    
    // Perform both searches in parallel
    const [vectorResults, textResults] = await Promise.all([
      vectorSearch(query, { ...options, limit: limit * 2 }),
      textSearch(query, { ...options, limit: limit * 2 }),
    ]);
    
    // Combine and deduplicate results
    const combinedResults = new Map();
    
    // Add vector search results (higher weight)
    vectorResults.forEach(result => {
      const key = result._id?.toString() || result.content;
      combinedResults.set(key, {
        ...result,
        score: (result.score || 0) * 0.7, // Weight vector search results
      });
    });
    
    // Add text search results
    textResults.forEach(result => {
      const key = result._id?.toString() || result.content;
      const existing = combinedResults.get(key);
      if (existing) {
        // Combine scores if document exists in both results
        existing.score = (existing.score || 0) + (result.score || 0) * 0.3;
      } else {
        combinedResults.set(key, {
          ...result,
          score: (result.score || 0) * 0.3, // Weight text search results
        });
      }
    });
    
    // Sort by combined score and return top results
    const finalResults = Array.from(combinedResults.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
    
    console.log(`🔍 Hybrid search found ${finalResults.length} results for query: "${query}"`);
    
    return finalResults;
  } catch (error) {
    console.error('Error performing hybrid search:', error);
    throw new Error('Failed to perform hybrid search');
  }
}

/**
 * Get similar documents to a given document
 */
export async function findSimilarDocuments(
  documentId: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const collection = await getCollection('documents');
    const document = await collection.findOne({ _id: new ObjectId(documentId) });
    
    if (!document || !document.embedding) {
      throw new Error('Document not found or has no embedding');
    }
    
    const { limit = 5 } = options;
    
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: document.embedding,
          numCandidates: limit * 10,
          limit: limit + 1, // +1 to exclude the original document
        },
      },
      {
        $addFields: {
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          _id: { $ne: new ObjectId(documentId) }, // Exclude the original document
        },
      },
      {
        $project: {
          title: 1,
          content: 1,
          metadata: 1,
          score: 1,
          createdAt: 1,
        },
      },
    ];
    
    const results = await collection.aggregate(pipeline).toArray();
    
    console.log(`🔍 Found ${results.length} similar documents to document: ${documentId}`);
    
    return results as SearchResult[];
  } catch (error) {
    console.error('Error finding similar documents:', error);
    throw new Error('Failed to find similar documents');
  }
}

/**
 * Simple document retrieval - gets all documents and returns first N
 */
export async function getAllDocumentsSimple(
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const { limit = 3 } = options;
    const allDocs = await getAllDocuments();
    
    const results = allDocs.slice(0, limit).map(doc => ({
      ...doc,
      score: 1.0, // Give them all the same score
    }));
    
    console.log(`📚 Retrieved ${results.length} documents from database`);
    
    return results;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw new Error('Failed to retrieve documents');
  }
}
