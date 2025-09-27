import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Document {
  id?: string;
  title?: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmbeddingResult {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embedding for a single text using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return {
      embedding: response.data[0].embedding,
      usage: response.usage,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map((data, index) => ({
      embedding: data.embedding,
      usage: response.usage,
    }));
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Prepare text for embedding by combining title and content
 */
export function prepareTextForEmbedding(document: Document): string {
  if (document.title && document.content) {
    return `${document.title}: ${document.content}`;
  }
  return document.content;
}

/**
 * Generate embedding for a document
 */
export async function embedDocument(document: Document): Promise<Document> {
  const text = prepareTextForEmbedding(document);
  const { embedding } = await generateEmbedding(text);
  
  return {
    ...document,
    embedding,
    createdAt: document.createdAt || new Date(),
    updatedAt: new Date(),
  };
}
