# MongoDB Atlas Setup for RAG System

## 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is fine for testing)
3. Create a database user with read/write permissions
4. Whitelist your IP address or use `0.0.0.0/0` for all IPs (development only)

## 2. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `rag_database` (or update the code)

## 3. Create Vector Search Index

In MongoDB Atlas, go to your cluster and create a vector search index:

### Index Configuration:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

### Steps:
1. Go to your cluster in Atlas
2. Click "Search" tab
3. Click "Create Index"
4. Choose "JSON Editor"
5. Paste the configuration above
6. Name it `vector_index`
7. Create the index

## 4. Environment Variables

Create a `.env.local` file in your project root:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rag_database?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key_here
```

## 5. Test the Setup

Run the test script to verify everything works:

```bash
npm run dev
# In another terminal:
node test-rag-system.js
```

## 6. Database Schema

The documents will be stored in the `documents` collection with this structure:

```json
{
  "_id": "ObjectId",
  "title": "Document Title",
  "content": "Document content...",
  "embedding": [0.123, -0.456, ...], // 1536-dimensional vector
  "metadata": {},
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 7. API Endpoints

- `POST /api/embeddings` - Store documents with embeddings
- `POST /api/rag` - Ask questions and get RAG responses
- `POST /api/chat` - Original chat endpoint (still available)

## Troubleshooting

### Vector Search Not Working
- Ensure the vector search index is created and active
- Check that embeddings have 1536 dimensions
- Verify the index name matches `vector_index` in the code

### Connection Issues
- Check your MongoDB URI format
- Ensure your IP is whitelisted
- Verify database user permissions

### OpenAI API Issues
- Check your API key is valid
- Ensure you have credits/quota available
- Verify the model name (`text-embedding-3-small`)
