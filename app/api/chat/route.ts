import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Prepare conversation history for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Be friendly, concise, and helpful in your responses.'
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({
      response,
      usage: completion.usage
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
