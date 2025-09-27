import { NextRequest, NextResponse } from 'next/server';
import { storeDocuments } from '@/lib/storage';
import { Document } from '@/lib/embeddings';

// ========================================
// RAG STEP 1: DOCUMENT PROCESSING & EMBEDDING
// ========================================

/**
 * STEP 1A: Format incoming documents for processing
 */
function formatDocumentsForProcessing(documents: any[]): Document[] {
  console.log(`📝 STEP 1A: Formatting ${documents.length} documents`);
  
  return documents.map((doc: any) => {
    if (typeof doc === 'string') {
      return { content: doc };
    }
    return {
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
    };
  });
}

/**
 * STEP 1B: Generate embeddings for documents
 */
async function generateDocumentEmbeddings(formattedDocuments: Document[]) {
  console.log(`🔢 STEP 1B: Generating embeddings for ${formattedDocuments.length} documents`);
  
  const { generateEmbeddings } = await import('@/lib/embeddings');
  const embeddings = await generateEmbeddings(
    formattedDocuments.map(doc => 
      doc.title && doc.content ? `${doc.title}: ${doc.content}` : doc.content
    )
  );

  return formattedDocuments.map((doc, index) => ({
    ...doc,
    embedding: embeddings[index].embedding,
  }));
}

/**
 * STEP 1C: Store documents with embeddings in vector database
 */
async function storeDocumentsInVectorDB(documentsWithEmbeddings: any[]) {
  console.log(`💾 STEP 1C: Storing ${documentsWithEmbeddings.length} documents in MongoDB`);
  
  const storedDocuments = await storeDocuments(documentsWithEmbeddings);
  console.log(`✅ Successfully stored ${storedDocuments.length} documents with embeddings`);
  
  return storedDocuments;
}

// ========================================
// MAIN API ENDPOINT
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { documents, store = true } = await request.json();

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documents array is required' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 STARTING RAG STEP 1: Document Processing & Embedding`);
    console.log(`📊 Processing ${documents.length} documents`);

    // Execute RAG Step 1: Document Processing Pipeline
    const formattedDocuments = formatDocumentsForProcessing(documents);
    
    if (store) {
      // Complete pipeline: Format → Embed → Store
      const documentsWithEmbeddings = await generateDocumentEmbeddings(formattedDocuments);
      const storedDocuments = await storeDocumentsInVectorDB(documentsWithEmbeddings);
      
      return NextResponse.json({
        message: `✅ RAG Step 1 Complete: Successfully stored ${storedDocuments.length} documents`,
        step: "Document Processing & Embedding",
        documents: storedDocuments.map(doc => ({
          id: doc._id,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          createdAt: doc.createdAt,
        })),
      });
    } else {
      // Just generate embeddings without storing (for testing)
      const documentsWithEmbeddings = await generateDocumentEmbeddings(formattedDocuments);
      
      return NextResponse.json({
        message: `✅ RAG Step 1 Complete: Generated embeddings for ${documentsWithEmbeddings.length} documents`,
        step: "Document Processing & Embedding",
        embeddings: documentsWithEmbeddings,
        usage: null, // Usage info not available in this context
      });
    }

  } catch (error) {
    console.error('❌ RAG Step 1 Error:', error);
    return NextResponse.json(
      { error: 'Failed to process documents in RAG Step 1' },
      { status: 500 }
    );
  }
}
