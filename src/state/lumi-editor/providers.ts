import type { ProviderType, ProviderConfig } from './types';

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI (trả phí theo API)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4.1-mini',
    requiresModel: true,
  },
  gemini: {
    name: 'Google Gemini (có hạn mức miễn phí)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.5-flash',
    requiresModel: true,
  },
  openrouter: {
    name: 'OpenRouter (miễn phí / trả phí)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openrouter/free',
    requiresModel: true,
  },
  groq: {
    name: 'Groq (có hạn mức miễn phí)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    requiresModel: true,
  },
  custom: {
    name: 'API tương thích OpenAI (tùy chỉnh)',
    endpoint: 'http://localhost:1234/v1/chat/completions',
    model: 'local-model',
    requiresModel: true,
  },
};

export const DEFAULT_PROVIDER: ProviderType = 'openai';
