
import { NextRequest, NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: NextRequest) {
  
  try {
    const modelsList = await groq.models.list();
    return NextResponse.json(modelsList.data);
  } catch (error) {
    console.error("Error getting Groq response:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}

