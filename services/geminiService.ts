import { GoogleGenAI } from "@google/genai";
import { Message, Source } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const OPENROUTER_API_KEY = "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";

// System prompt optimized for pure speed and data retrieval
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

const isComplexQuery = (query: string): boolean => {
  const complexityKeywords = ['analyze', 'compare', 'contrast', 'evaluate', 'implications', 'history of', 'detailed', 'comprehensive', 'code', 'function', 'app', 'grok'];
  const wordCount = query.split(' ').length;
  return wordCount > 15 || complexityKeywords.some(keyword => query.toLowerCase().includes(keyword));
};

export const streamSearchResponse = async (
  query: string,
  history: Message[],
  onChunk: (chunk: string, thinking?: string) => void,
  onSources: (sources: Source[]) => void,
  isDeepThink: boolean,
  isReasoning: boolean
) => {
  // If Reasoning Mode is enabled, bypass Gemini and use Grok via OpenRouter
  if (isReasoning) {
    await streamGrokResponse(query, history, onChunk);
    return;
  }

  const wantsGrok = query.toLowerCase().includes("use grok");
  const complex = isComplexQuery(query);
  const effectiveDeepThink = isDeepThink || wantsGrok || complex;

  const model = 'gemini-2.0-flash'; 

  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const config: any = {
    tools: [{ googleSearch: {} }],
    systemInstruction: effectiveDeepThink ? DEEP_THINK_SYSTEM_INSTRUCTION : FAST_SYSTEM_INSTRUCTION,
  };

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

// OpenRouter Grok 4.1 Integration
const streamGrokResponse = async (
  query: string, 
  history: Message[], 
  onChunk: (chunk: string, thinking?: string) => void
) => {
    try {
        const messages = history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.text
        }));

        // Append current query if not already in history (it should be, but safety check)
        if (messages[messages.length - 1].content !== query) {
            messages.push({ role: 'user', content: query });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "x-ai/grok-4.1-fast:free", // Using free endpoint based on previous context
                "messages": messages,
                "stream": false, // Simpler to handle non-stream for reasoning first pass
                "include_reasoning": true // OpenRouter specific flag for reasoning
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            const message = data.choices[0].message;
            const content = message.content || "";
            const reasoning = message.reasoning || null; // Check for reasoning field

            // Send thinking content first if available
            if (reasoning) {
                onChunk("", reasoning);
            }
            
            // Send main content
            onChunk(content);
        } else {
             onChunk("*Grok response empty or unavailable.*");
        }

    } catch (error) {
        console.error("Grok API Error:", error);
        onChunk("*Error connecting to Grok Reasoning service.*");
    }
}
