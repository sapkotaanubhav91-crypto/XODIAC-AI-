import { GoogleGenAI } from "@google/genai";
import { Message, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System prompt optimized for pure speed and data retrieval
// UPDATED: Relaxed "ALWAYS SEARCH" rule to allow conversational greetings.
const FAST_SYSTEM_INSTRUCTION = `You are a high-speed search engine interface. 

Guidelines:
1.  **Greetings & Conversation:** If the user says "hi", "hello", or asks a conversational question, answer naturally and briefly. **DO NOT SEARCH** for these inputs.
2.  **Information Retrieval:** For any factual query, news, or question needing data, **ALWAYS** use the googleSearch tool immediately.
3.  **Speed is Priority:** Be direct. Do not use filler phrases.
4.  **Formatting:** Use Markdown.
5.  **Related Questions:** AT THE VERY END, strictly output a list of 3-4 related follow-up questions:
    RELATED_QUESTIONS:
    - [Question 1]
    - [Question 2]
    - [Question 3]
`;

// Detailed system prompt for deep thinking/research
const DEEP_THINK_SYSTEM_INSTRUCTION = `You are a helpful and knowledgeable AI research assistant (Deep Think Mode).

Guidelines:
1.  **Research First:** For complex queries, use the googleSearch tool to gather comprehensive information.
2.  **Reasoning:** Analyze the search results and provide a well-reasoned, concise answer.
3.  **Citations:** Provide inline citations.
4.  **Format:** Use Markdown.
5.  **Related Questions:** AT THE VERY END, strictly output a list of 3-4 related follow-up questions:
    RELATED_QUESTIONS:
    - [Question 1]
    - [Question 2]
    - [Question 3]

** Canvas/Immersive Document Instructions **
(Only apply if user explicitly asks for code, long content, or visualizations)
Structure for Canvas:
<immersive> id="{unique_id}" type="code" title="{descriptive_title}"
{content}
</immersive>
`;

// Helper to detect complex queries
const isComplexQuery = (query: string): boolean => {
  const complexityKeywords = ['analyze', 'compare', 'contrast', 'evaluate', 'implications', 'history of', 'detailed', 'comprehensive', 'code', 'function', 'app', 'grok'];
  const wordCount = query.split(' ').length;
  // "Hi" is short, so it will fail this and go to FAST mode.
  return wordCount > 15 || complexityKeywords.some(keyword => query.toLowerCase().includes(keyword));
};

export const streamSearchResponse = async (
  query: string,
  history: Message[],
  onChunk: (chunk: string) => void,
  onSources: (sources: Source[]) => void,
  isDeepThink: boolean
) => {
  // 1. Determine Intent
  const wantsGrok = query.toLowerCase().includes("use grok");
  const complex = isComplexQuery(query);
  
  // "Hi" -> complex=false, effectiveDeepThink=false -> FAST_SYSTEM_INSTRUCTION
  const effectiveDeepThink = isDeepThink || wantsGrok || complex;

  // Use gemini-2.0-flash for everything to ensure speed and consistency
  const model = 'gemini-2.0-flash'; 

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const config: any = {
    tools: [{ googleSearch: {} }],
    systemInstruction: effectiveDeepThink ? DEEP_THINK_SYSTEM_INSTRUCTION : FAST_SYSTEM_INSTRUCTION,
  };

  // Note: thinkingConfig is not supported by gemini-2.0-flash, so we rely on system instructions
  // for the "Deep Think" persona.

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config
    });

    for await (const chunk of responseStream) {
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const sources: Source[] = groundingChunks
                .map((c: any) => {
                    if (c.web) {
                        return { title: c.web.title, uri: c.web.uri };
                    }
                    return null;
                })
                .filter((s: any) => s !== null);
            
            if (sources.length > 0) {
                onSources(sources);
            }
        }

        const text = chunk.text;
        if (text) {
            onChunk(text);
        }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    onChunk("\n\n*I encountered an error while processing your request. Please try again later.*");
  }
};