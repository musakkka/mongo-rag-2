import { Collection, ObjectId } from 'mongodb';
import { getCollection } from './mongodb';
import { Document, embedDocument } from './embeddings';

export interface StoredDocument extends Document {
  _id?: ObjectId;
}

/**
 * Store a single document with embedding in MongoDB
 */
export async function storeDocument(document: Document): Promise<StoredDocument> {
  try {
    const collection = await getCollection('documents');
    
    // Generate embedding for the document
    const documentWithEmbedding = await embedDocument(document);
    
    // Insert the document
    const result = await collection.insertOne(documentWithEmbedding);
    
    console.log(`✅ Document stored with ID: ${result.insertedId}`);
    return {
      ...documentWithEmbedding,
      _id: result.insertedId,
    };
  } catch (error) {
    console.error('Error storing document:', error);
    throw new Error('Failed to store document');
  }
}

/**
 * Store multiple documents with embeddings in MongoDB
 */
export async function storeDocuments(documents: Document[]): Promise<StoredDocument[]> {
  try {
    const collection = await getCollection('documents');
    
    // Generate embeddings for all documents
    const documentsWithEmbeddings = await Promise.all(
      documents.map(doc => embedDocument(doc))
    );
    
    // Insert all documents
    const result = await collection.insertMany(documentsWithEmbeddings);
    
    console.log(`✅ ${result.insertedCount} documents stored`);
    
    // Return documents with their MongoDB IDs
    return documentsWithEmbeddings.map((doc, index) => ({
      ...doc,
      _id: result.insertedIds[index],
    }));
  } catch (error) {
    console.error('Error storing documents:', error);
    throw new Error('Failed to store documents');
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, document: Partial<Document>): Promise<StoredDocument | null> {
  try {
    const collection = await getCollection('documents');
    
    // If content or title changed, regenerate embedding
    let documentWithEmbedding = { ...document };
    if (document.content || document.title) {
      documentWithEmbedding = await embedDocument(document as Document);
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...documentWithEmbedding,
          updatedAt: new Date(),
        }
      },
      { returnDocument: 'after' }
    );
    
    if (result) {
      console.log(`✅ Document updated: ${id}`);
      return result as StoredDocument;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const collection = await getCollection('documents');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Document deleted: ${id}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<StoredDocument[]> {
  try {
    const collection = await getCollection('documents');
    const documents = await collection.find({}).toArray();
    
    return documents as StoredDocument[];
  } catch (error) {
    console.error('Error getting documents:', error);
    throw new Error('Failed to get documents');
  }
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<StoredDocument | null> {
  try {
    const collection = await getCollection('documents');
    const document = await collection.findOne({ _id: new ObjectId(id) });
    
    return document as StoredDocument | null;
  } catch (error) {
    console.error('Error getting document:', error);
    throw new Error('Failed to get document');
  }
}
