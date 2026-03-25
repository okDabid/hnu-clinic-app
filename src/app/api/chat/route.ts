import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for clinic chatbot
const SYSTEM_PROMPT = `You are a helpful AI assistant for HNU Clinic Health Record and Appointment System. You provide information about:
- Appointment scheduling and management
- Health records information
- Clinic services and facilities
- General health and wellness information
- Frequently asked questions about the clinic

Be professional, friendly, and empathetic. Always prioritize patient privacy and confidentiality when discussing sensitive health information. 
If a user asks for specific medical advice, encourage them to consult with a healthcare professional at the clinic.
If the query is outside your scope, politely redirect the user to contact the clinic directly.

Clinic Information:
- Name: HNU Clinic Health Record and Appointment System
- We serve Holy Name University community (students, faculty, staff)
- Services include appointments, health records management, and general healthcare
- Our team includes doctors, nurses, and healthcare professionals

Always be helpful and try to resolve user queries within your knowledge base first.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Stream the response using openai
    const result = streamText({
      model: openai("gpt-4-turbo"),
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.7,
    });

    // Return the streamed response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
