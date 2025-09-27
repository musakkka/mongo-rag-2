// Test script for the embeddings endpoint
const testData = [
  {
    title: 'MongoDB Overview',
    content: 'MongoDB is a document database with the scalability and flexibility that you want with the querying and indexing that you need.'
  },
  {
    title: 'Vector Search',
    content: 'MongoDB Atlas Vector Search enables you to build vector search applications by storing embeddings and performing k-nearest neighbor (k-NN) search.'
  }
];

async function testEmbeddings() {
  try {
    const response = await fetch('http://localhost:3000/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: testData
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Embeddings generated successfully!');
      console.log('📊 Usage:', result.usage);
      console.log('📝 Documents with embeddings:');
      result.embeddings.forEach((doc, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log(`Title: ${doc.title}`);
        console.log(`Content: ${doc.content}`);
        console.log(`Embedding vector length: ${doc.embedding.length}`);
        console.log(`First 5 embedding values: [${doc.embedding.slice(0, 5).join(', ')}...]`);
      });
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run the test
testEmbeddings();
