# AI Chatbot Integration Guide

## Overview
The HNU Clinic website now includes an AI-powered chatbot assistant to help users with questions about appointments, health records, and clinic services.

## Setup Instructions

### 1. Get an OpenAI API Key

1. Visit [OpenAI API](https://platform.openai.com/api/keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again)

### 2. Add the API Key to Environment Variables

Open `.env.local` in the project root and update:

```
OPENAI_API_KEY=sk_your_actual_api_key_here
```

Replace `sk_your_actual_api_key_here` with your actual OpenAI API key.

### 3. Install Dependencies

The required packages have already been installed:
- `ai` - Vercel AI SDK for chat handling
- `openai` - OpenAI client library

If needed, run:
```bash
npm install ai openai
```

## Files Created

### Backend
- **`src/app/api/chat/route.ts`** - API endpoint for handling chat requests
  - Uses GPT-4 Turbo model
  - Streams responses for real-time feedback
  - Includes system prompt for clinic context
  - Rate limiting ready for future enhancement

### Frontend
- **`src/components/chat-widget.tsx`** - Chat widget component
  - Floating button in the bottom-right corner
  - Dialog modal for chat interface
  - Real-time message updates
  - Loading states and error handling

## How It Works

1. User clicks the floating chat button in the bottom-right corner
2. Chat dialog opens
3. User types a message and sends it
4. Request goes to `/api/chat` endpoint
5. OpenAI API processes the request
6. Response streams back to the user in real-time
7. Messages appear in the chat window

## System Prompt Features

The chatbot is trained with information about:
- Appointment scheduling
- Health records management
- Clinic services
- General health information
- Privacy and confidentiality requirements

The assistant will:
- Provide helpful, friendly responses
- Encourage users to consult professionals for medical advice
- Direct users to contact the clinic for specific issues
- Maintain patient privacy standards

## Integration into Pages

To add the chat widget to your pages, import and use it in the layout:

### In `src/app/layout.tsx`:
```tsx
import { ChatWidget } from "@/components/chat-widget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
```

## Customization

### Change the Model
In `src/app/api/chat/route.ts`, modify:
```typescript
model: openai("gpt-4-turbo"), // Change to gpt-3.5-turbo for faster/cheaper responses
```

### Update System Prompt
Edit the `SYSTEM_PROMPT` constant in `src/app/api/chat/route.ts` to customize the chatbot's behavior and knowledge base.

### Style the Widget
Modify the classes in `src/components/chat-widget.tsx` to match your design system.

## Cost Considerations

- **GPT-4 Turbo**: ~$0.01-0.03 USD per 1K tokens (more accurate)
- **GPT-3.5 Turbo**: ~$0.0005-0.0015 USD per 1K tokens (faster, cheaper)

For testing, GPT-3.5 Turbo is recommended. Switch to GPT-4 Turbo for production if needed.

## Troubleshooting

### "API key not configured" error
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after changing environment variables

### Chat not responding
- Check that your OpenAI API key is valid and has credits
- Verify the API endpoint is working via `/api/chat` 
- Check browser console for errors

### Hydration errors
- The component uses `useEffect` to only render on client side
- This prevents server-side rendering issues

## Monitoring & Analytics

You can track chatbot usage by:
1. Logging messages to your database
2. Using OpenAI's usage monitoring dashboard
3. Adding analytics events when users interact with the widget

## Future Enhancements

- **Database Integration**: Store chat history and user interactions
- **Clinic Data Access**: Query appointment availability, doctor schedules from Prisma
- **Authentication Context**: Use NextAuth to personalize responses per user
- **Image Support**: Allow users to upload medical documents
- **Multi-language Support**: Add internationalization
- **Smart Routing**: Auto-detect query type and route to appropriate department

## Support

For issues or questions about the chatbot:
1. Check the troubleshooting section
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check Vercel AI SDK docs: https://sdk.vercel.ai
