export type AIProvider = 'gemini' | 'groq' | 'openrouter' | 'mock' | 'openai' | 'anthropic' | 'ollama'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
}

export interface ProviderMeta {
  name: string
  badge: string
  isFree: boolean
  defaultModel: string
  models: string[]
  keyPlaceholder: string
  keyPrefix?: string
  helpUrl: string
  notes: string
}

export const PROVIDER_DEFAULTS: Record<AIProvider, ProviderMeta> = {
  gemini: {
    name: 'Google Gemini',
    badge: '100% Free Tier',
    isFree: true,
    defaultModel: 'gemini-flash-latest',
    models: ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.5-flash-lite'],
    keyPlaceholder: 'AQ... or AIzaSy... (Free key from Google AI Studio)',
    keyPrefix: 'AQ.',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    notes: 'Free forever without credit card. 15 requests/min, 1,500/day. Best recommended free option.',
  },
  groq: {
    name: 'Groq Cloud',
    badge: '100% Free & Fast',
    isFree: true,
    defaultModel: 'openai/gpt-oss-120b',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'groq/compound', 'groq/compound-mini'],
    keyPlaceholder: 'gsk_... (Free key from Groq Console)',
    keyPrefix: 'gsk_',
    helpUrl: 'https://console.groq.com/keys',
    notes: 'Ultra-fast inference (GPT-OSS-120B). Free with generous rate limits, no credit card required.',
  },
  openrouter: {
    name: 'OpenRouter (Free Models)',
    badge: 'Free AI Models',
    isFree: true,
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    models: [
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1:free',
      'mistralai/mistral-7b-instruct:free',
    ],
    keyPlaceholder: 'sk-or-... (Free key from openrouter.ai)',
    keyPrefix: 'sk-or-',
    helpUrl: 'https://openrouter.ai/keys',
    notes: 'Access free open-weights and DeepSeek R1 models with zero subscription.',
  },
  mock: {
    name: 'CyberTrace Neural Forensics',
    badge: 'Built-in & Free',
    isFree: true,
    defaultModel: 'cybertrace-forensics-v1',
    models: ['cybertrace-forensics-v1'],
    keyPlaceholder: 'Ready to use out-of-the-box — no signup or key needed',
    helpUrl: '#',
    notes: 'Pre-loaded offline intelligence across 12 specialized forensic domains.',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    badge: 'Requires Credits',
    isFree: false,
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    helpUrl: 'https://platform.openai.com/api-keys',
    notes: 'Requires OpenAI account with prepaid API usage credits.',
  },
  anthropic: {
    name: 'Anthropic Claude',
    badge: 'Requires Credits',
    isFree: false,
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    notes: 'Requires Anthropic console account with active credits.',
  },
  ollama: {
    name: 'Ollama (Local LLM)',
    badge: 'Free & Local',
    isFree: true,
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'qwen2.5', 'llama3.1'],
    keyPlaceholder: 'http://localhost:11434 (No key required)',
    helpUrl: 'https://ollama.com/',
    notes: 'Runs locally on your machine with 0 cost.',
  },
}

const STORAGE_KEYS = {
  PROVIDER: 'cybertrace_ai_provider',
  API_KEY: 'cybertrace_ai_key',
  MODEL: 'cybertrace_ai_model',
}

export const DEFAULT_FREE_KEYS: Record<string, string> = {
  groq: import.meta.env.VITE_GROQ_API_KEY || '',
  gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
  openrouter: import.meta.env.VITE_OPENROUTER_API_KEY || '',
}

export function detectProviderFromKey(key: string): AIProvider | null {
  const trimmed = key.trim()
  if (trimmed.startsWith('AIzaSy') || trimmed.startsWith('AQ.')) return 'gemini'
  if (trimmed.startsWith('gsk_')) return 'groq'
  if (trimmed.startsWith('sk-or-')) return 'openrouter'
  if (trimmed.startsWith('sk-ant-')) return 'anthropic'
  if (trimmed.startsWith('sk-')) return 'openai'
  return null
}

export function getAiConfig(): AIConfig {
  const provider = (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AIProvider) || 'groq'
  const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
  const apiKey = savedKey !== null && savedKey !== '' ? savedKey : (DEFAULT_FREE_KEYS[provider] || '')
  const model = localStorage.getItem(STORAGE_KEYS.MODEL) || PROVIDER_DEFAULTS[provider]?.defaultModel || 'llama-3.3-70b-versatile'
  return { provider, apiKey, model }
}

export function saveAiConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEYS.PROVIDER, config.provider)
  localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim())
  localStorage.setItem(STORAGE_KEYS.MODEL, config.model.trim())
  if (config.apiKey) {
    localStorage.setItem(`cybertrace_key_${config.provider}`, config.apiKey.trim())
  }
  window.dispatchEvent(new Event('cybertrace_ai_config_changed'))
}

export interface AIResponseData {
  summary: string
  hypothesis: string
  confidence: string
  reasoning: string
  next_steps: string[]
  providerLabel?: string
}

/**
 * Call LLM directly from browser (ideal when backend is offline or for instant response)
 */
export async function callDirectLLM(prompt: string, config: AIConfig): Promise<AIResponseData> {
  const { provider, apiKey, model } = config
  if (!apiKey && provider !== 'mock' && provider !== 'ollama') {
    throw new Error(`Free API key is required for ${PROVIDER_DEFAULTS[provider]?.name || provider}. You can get one free at ${PROVIDER_DEFAULTS[provider]?.helpUrl}`)
  }

  const systemInstruction = `You are CyberTrace, an expert AI digital forensics and financial crimes investigator.
Analyze the following inquiry or case evidence.
Always respond in valid JSON format with EXACTLY these keys:
{
  "summary": "Brief executive summary of findings (1-2 sentences)",
  "hypothesis": "Investigative hypothesis or conclusion",
  "confidence": "High, Medium, or Low (with probability e.g. High (0.92))",
  "reasoning": "Detailed technical forensic reasoning explaining the evidence, entities, patterns, and mechanisms",
  "next_steps": ["Actionable step 1", "Actionable step 2", "Actionable step 3", "Actionable step 4"]
}`

  // 1. Google Gemini (100% Free Tier)
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nEvidence / Inquiry:\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      try {
        const parsed = JSON.parse(errText)
        throw new Error(parsed.error?.message || `Gemini Free Tier error (${res.status})`)
      } catch (e: any) {
        throw new Error(e.message || `Gemini Free Tier error (${res.status}): ${errText.slice(0, 150)}`)
      }
    }

    const data = await res.json()
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = parseLLMJson(contentText)
    return {
      ...parsed,
      providerLabel: `Google Gemini Free Tier (${model})`,
    }
  }

  // 2. Groq Cloud (100% Free Tier & Ultra Fast)
  if (provider === 'groq') {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error?.message || `Groq API error (${res.status})`)
    }

    const data = await res.json()
    const contentText = data.choices?.[0]?.message?.content || '{}'
    const parsed = parseLLMJson(contentText)
    return {
      ...parsed,
      providerLabel: `Groq Free (${model})`,
    }
  }

  // 3. OpenRouter (Free AI Models)
  if (provider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://cybertrace.local',
        'X-Title': 'CyberTrace Forensics',
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error?.message || `OpenRouter error (${res.status})`)
    }

    const data = await res.json()
    const contentText = data.choices?.[0]?.message?.content || '{}'
    const parsed = parseLLMJson(contentText)
    return {
      ...parsed,
      providerLabel: `OpenRouter Free (${model})`,
    }
  }

  // 4. OpenAI
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error?.message || `OpenAI API error (${res.status})`)
    }

    const data = await res.json()
    const contentText = data.choices?.[0]?.message?.content || '{}'
    const parsed = parseLLMJson(contentText)
    return {
      ...parsed,
      providerLabel: `OpenAI (${model})`,
    }
  }

  // 5. Ollama
  if (provider === 'ollama') {
    const endpoint = 'http://localhost:11434/api/generate'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        prompt: `${systemInstruction}\n\nEvidence / Inquiry:\n${prompt}`,
        format: 'json',
        stream: false,
      }),
    })
    if (!res.ok) throw new Error(`Ollama error (${res.status})`)
    const data = await res.json()
    const parsed = parseLLMJson(data.response || '{}')
    return {
      ...parsed,
      providerLabel: `Ollama (${model})`,
    }
  }

  throw new Error(`Direct connection not supported for provider '${provider}'. Select Google Gemini, Groq, or OpenRouter for free access.`)
}

function parseLLMJson(text: string): AIResponseData {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const json = JSON.parse(cleaned)
    return {
      summary: json.summary || 'Forensic analysis completed.',
      hypothesis: json.hypothesis || 'Primary investigative lead identified.',
      confidence: json.confidence || 'High (0.90)',
      reasoning: json.reasoning || json.content || text,
      next_steps: Array.isArray(json.next_steps) && json.next_steps.length > 0 ? json.next_steps : [
        'Secure transactional ledgers and correspondent clearing audit trails',
        'Verify counterparty beneficial ownership records in corporate registry',
        'Preserve evidentiary block hashes under ISO/IEC 27037 standards',
      ],
    }
  } catch {
    return {
      summary: 'Analysis completed.',
      hypothesis: 'Investigative assessment generated from evidence records.',
      confidence: 'Medium',
      reasoning: text,
      next_steps: ['Conduct detailed entity tracing across banking and corporate registers'],
    }
  }
}
