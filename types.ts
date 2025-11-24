export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  relatedQuestions?: string[];
  imageUrl?: string;
  isThinking?: boolean;
  isDeepThink?: boolean;
  isReasoning?: boolean; // New flag for Reasoning Mode
  thinking?: string;     // Content of the thinking/reasoning process
}

export interface SearchState {
  query: string;
  messages: Message[];
  isLoading: boolean;
}