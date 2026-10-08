export type ID = string;

export type ProviderType = 'openai' | 'gemini' | 'openrouter' | 'custom';

export interface ProviderConfig {
  name: string;
  endpoint: string;
  requiresModel: boolean;
  model: string;
}

export interface TextContent {
  id: ID;
  text: string;
  type: 'text';
}

export interface MultipleChoiceContent {
  id: ID;
  question: string;
  answers: { correct: boolean; text: string }[];
  type: 'multiple-choice';
}

export interface FillInTheBlanks {
  id: ID;
  text: string;
  type: 'fill-in-the-blanks';
}

export interface Freetext {
  id: ID;
  task: string;
  type: 'freetext';
}

export type Content = TextContent | MultipleChoiceContent | FillInTheBlanks | Freetext;

export type ContentType = Content['type'];

export interface LumiEditorState {
  apiConfig: {
    provider: ProviderType;
    apiEndpoint: string;
    apiToken: string;
    model: string;
  };
  title: string;
  content: {
    [id: string]: Content;
  };
  structure: Array<ID>;
  worksheetId?: string | null;
  ui: {
    loading: {
      [id: string]: boolean;
    };
    saving?: boolean;
    tokenLimitError?: string | null;
  };
}
