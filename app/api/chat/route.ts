import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// ========================================
// RAG STEP 3: CONVERSATIONAL AI (NON-RAG)
// ========================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

/**
 * STEP 3A: Configure AI system prompt for MongoDB expertise
 */
function configureSystemPrompt() {
  console.log(`⚙️ STEP 3A: Configuring AI system prompt`);
  
  const systemPrompt = 'You are a MongoDB expert sales consultant. Keep responses SHORT. Use bullet points. Small sentences only. Help customers understand MongoDB plans quickly.';
  
  console.log(`📝 System Prompt: MongoDB expert sales consultant`);
  return systemPrompt;
}

/**
 * STEP 3B: Format conversation history for AI context
 */
function formatConversationHistory(conversationHistory: any[], currentMessage: string) {
  console.log(`💬 STEP 3B: Formatting conversation history`);
  
  const messages = [
    {
      role: 'system' as const,
      content: configureSystemPrompt()
    },
    ...conversationHistory.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    })),
    {
      role: 'user' as const,
      content: currentMessage
    }
  ];
  
  console.log(`📊 Conversation: ${conversationHistory.length} previous messages + current message`);
  return messages;
}

/**
 * STEP 3C: Generate AI response using OpenAI API
 */
async function generateAIResponse(formattedMessages: any[]) {
  console.log(`🤖 STEP 3C: Generating AI response via OpenAI`);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: formattedMessages,
    max_tokens: 200,
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  
  console.log(`✅ Generated response: ${response.length} characters`);
  return { response, usage: completion.usage };
}

/**
 * STEP 3D: Format response for presentation
 */
function formatChatResponse(response: string, usage: any) {
  console.log(`📋 STEP 3D: Formatting chat response for presentation`);
  
  return {
    response,
    usage,
    step: "Conversational AI (Non-RAG)",
    processSteps: [
      "User message received",
      "Conversation history loaded",
      "System prompt applied",
      "OpenAI API called",
      "Response generated and returned"
    ],
    note: "This is traditional conversational AI without document retrieval"
  };
}

// ========================================
// MAIN API ENDPOINT
// ========================================

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 STARTING RAG STEP 3: Conversational AI (Non-RAG)`);
    console.log(`💬 Message: "${message}"`);

    // Execute RAG Step 3: Conversational AI Pipeline
    const formattedMessages = formatConversationHistory(conversationHistory || [], message);
    const { response, usage } = await generateAIResponse(formattedMessages);
    const formattedResponse = formatChatResponse(response, usage);

    console.log(`✅ RAG Step 3 Complete: Generated conversational response`);

    return NextResponse.json(formattedResponse);

  } catch (error) {
    console.error('❌ RAG Step 3 Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate conversational response in Step 3' },
      { status: 500 }
    );
  }
}
