// src/app/api/groq/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, model, temperature } = await req.json();

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: 1024,
    });

    console.log("Chat completion:", chatCompletion.choices[0]?.message?.content);
    return NextResponse.json({ 
      content: chatCompletion.choices[0]?.message?.content || "No response from AI."
    });
  } catch (error) {
    console.error("Error getting Groq response:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}

