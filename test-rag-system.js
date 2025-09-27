// Test script for the complete RAG system
const testDocuments = [
  {
    title: 'MongoDB Overview',
    content: 'MongoDB is a document database with the scalability and flexibility that you want with the querying and indexing that you need.'
  },
  {
    title: 'Vector Search',
    content: 'MongoDB Atlas Vector Search enables you to build vector search applications by storing embeddings and performing k-nearest neighbor (k-NN) search.'
  },
  {
    title: 'RAG Applications',
    content: 'Retrieval-Augmented Generation (RAG) combines the power of large language models with external knowledge bases to provide accurate, up-to-date responses.'
  }
];

async function testRAGSystem() {
  console.log('🚀 Testing Complete RAG System\n');
  
  try {
    // Step 1: Store documents with embeddings
    console.log('📝 Step 1: Storing documents with embeddings...');
    const storeResponse = await fetch('http://localhost:3000/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documents: testDocuments,
        store: true
      })
    });

    if (!storeResponse.ok) {
      const error = await storeResponse.json();
      throw new Error(`Store failed: ${error.error}`);
    }

    const storeResult = await storeResponse.json();
    console.log(`✅ ${storeResult.message}`);
    console.log(`📊 Stored documents:`, storeResult.documents.map(doc => doc.title));
    console.log('');

    // Step 2: Test RAG with questions
    const testQuestions = [
      'What is MongoDB?',
      'How does vector search work?',
      'What is RAG and how does it help?',
      'Tell me about MongoDB Atlas features'
    ];

    for (const question of testQuestions) {
      console.log(`🤖 Step 2: Testing RAG with question: "${question}"`);
      
      const ragResponse = await fetch('http://localhost:3000/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          options: {
            searchLimit: 3,
            searchThreshold: 0.5
          }
        })
      });

      if (!ragResponse.ok) {
        const error = await ragResponse.json();
        throw new Error(`RAG failed: ${error.error}`);
      }

      const ragResult = await ragResponse.json();
      
      console.log(`📝 Answer: ${ragResult.answer}`);
      console.log(`📚 Sources used: ${ragResult.sources.length} documents`);
      ragResult.sources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.title} (Score: ${source.score?.toFixed(3) || 'N/A'})`);
      });
      console.log(`🔢 Tokens used: ${ragResult.usage?.total_tokens || 'N/A'}`);
      console.log('');
    }

    // Step 3: Test conversational RAG
    console.log('💬 Step 3: Testing conversational RAG...');
    const conversationHistory = [
      { role: 'user', content: 'What is MongoDB?' },
      { role: 'assistant', content: 'MongoDB is a document database with scalability and flexibility.' }
    ];

    const conversationalResponse = await fetch('http://localhost:3000/api/rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'Can you tell me more about its vector search capabilities?',
        conversationHistory: conversationHistory
      })
    });

    if (conversationalResponse.ok) {
      const conversationalResult = await conversationalResponse.json();
      console.log(`📝 Conversational Answer: ${conversationalResult.answer}`);
      console.log(`📚 Sources: ${conversationalResult.sources.length} documents`);
    }

    console.log('\n🎉 RAG System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRAGSystem();
