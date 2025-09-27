import OpenAI from 'openai';
import { vectorSearch, SearchResult } from './retrieval';
import { generateEmbedding } from './embeddings';
import { getAllDocuments } from './storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface RAGOptions {
  searchLimit?: number;
  searchThreshold?: number;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generate a response using RAG (Retrieval-Augmented Generation)
 */
export async function generateRAGResponse(
  question: string,
  options: RAGOptions = {}
): Promise<RAGResponse> {
  try {
    const {
      searchLimit = 5,
      searchThreshold = 0.7,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 200,
    } = options;

    console.log(`🤖 Generating RAG response for question: "${question}"`);

    // Step 1: Retrieve relevant documents using vector search
    const relevantDocs = await vectorSearch(question, {
      limit: searchLimit,
      threshold: searchThreshold,
    });

    if (relevantDocs.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question. Please try rephrasing your question or adding more documents to the knowledge base.",
        sources: [],
      };
    }

    console.log(`📚 Retrieved ${relevantDocs.length} relevant documents`);

    // Step 2: Prepare context from retrieved documents
    const context = relevantDocs
      .map((doc, index) => {
        const title = doc.title ? `Title: ${doc.title}\n` : '';
        const content = `Content: ${doc.content}`;
        const score = doc.score ? ` (Relevance: ${doc.score.toFixed(3)})` : '';
        return `Document ${index + 1}${score}:\n${title}${content}`;
      })
      .join('\n\n');

    // Step 3: Create the prompt for the LLM
    const systemPrompt = `You are a MongoDB expert sales consultant. Keep responses SHORT. Use bullet points. Small sentences only.

Instructions:
- Use only context documents for MongoDB questions
- Keep answers brief and concise
- Use bullet points for lists
- Small sentences only
- Focus on key facts

Context Documents:
${context}`;

    const userPrompt = `Question: ${question}`;

    // Step 4: Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log(`✅ Generated RAG response (${completion.usage?.total_tokens} tokens)`);

    return {
      answer,
      sources: relevantDocs,
      usage: completion.usage,
    };
  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw new Error('Failed to generate RAG response');
  }
}

/**
 * Generate a conversational RAG response with chat history
 */
export async function generateConversationalRAGResponse(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: RAGOptions = {}
): Promise<RAGResponse> {
  try {
    const {
      searchLimit = 5,
      searchThreshold = 0.7,
      model = 'gpt-4o-mini',
      temperature = 0.7,
      maxTokens = 200,
    } = options;

    console.log(`🤖 Generating conversational RAG response for question: "${question}"`);

    // Step 1: Retrieve relevant documents using vector search
    const relevantDocs = await vectorSearch(question, {
      limit: searchLimit,
      threshold: searchThreshold,
    });

    if (relevantDocs.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question. Please try rephrasing your question or adding more documents to the knowledge base.",
        sources: [],
      };
    }

    // Step 2: Prepare context from retrieved documents
    const context = relevantDocs
      .map((doc, index) => {
        const title = doc.title ? `Title: ${doc.title}\n` : '';
        const content = `Content: ${doc.content}`;
        const score = doc.score ? ` (Relevance: ${doc.score.toFixed(3)})` : '';
        return `Document ${index + 1}${score}:\n${title}${content}`;
      })
      .join('\n\n');

    // Step 3: Create the prompt for the LLM with conversation history
    const systemPrompt = `You are a MongoDB expert sales consultant. Keep responses SHORT. Use bullet points. Small sentences only.

Instructions:
- Use context documents and conversation history
- Keep answers brief and concise
- Use bullet points for lists
- Small sentences only
- Focus on key facts

Context Documents:
${context}`;

    // Prepare messages with conversation history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: question },
    ];

    // Step 4: Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log(`✅ Generated conversational RAG response (${completion.usage?.total_tokens} tokens)`);

    return {
      answer,
      sources: relevantDocs,
      usage: completion.usage,
    };
  } catch (error) {
    console.error('Error generating conversational RAG response:', error);
    throw new Error('Failed to generate conversational RAG response');
  }
}
