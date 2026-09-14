export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'mock'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
}

export const PROVIDER_DEFAULTS: Record<AIProvider, { name: string; defaultModel: string; models: string[]; keyPlaceholder: string; keyPrefix?: string; helpUrl: string }> = {
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.0-pro'],
    keyPlaceholder: 'AIzaSy...',
    keyPrefix: 'AIzaSy',
    helpUrl: 'https://aistudio.google.com/app/apikey',
  },
  openai: {
    name: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    helpUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    keyPlaceholder: 'sk-ant-...',
    keyPrefix: 'sk-ant-',
    helpUrl: 'https://console.anthropic.com/settings/keys',
  },
  ollama: {
    name: 'Ollama (Local LLM)',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'qwen2.5', 'llama3.1'],
    keyPlaceholder: 'http://localhost:11434 (No key required)',
    helpUrl: 'https://ollama.com/',
  },
  mock: {
    name: 'CyberTrace Neural Forensics (Built-in)',
    defaultModel: 'cybertrace-forensics-v1',
    models: ['cybertrace-forensics-v1'],
    keyPlaceholder: 'Built-in offline engine — no external key needed',
    helpUrl: '#',
  },
}

const STORAGE_KEYS = {
  PROVIDER: 'cybertrace_ai_provider',
  API_KEY: 'cybertrace_ai_key',
  MODEL: 'cybertrace_ai_model',
}

export function getAiConfig(): AIConfig {
  const provider = (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AIProvider) || 'mock'
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || ''
  const model = localStorage.getItem(STORAGE_KEYS.MODEL) || PROVIDER_DEFAULTS[provider]?.defaultModel || 'gemini-1.5-flash'
  return { provider, apiKey, model }
}

export function saveAiConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEYS.PROVIDER, config.provider)
  localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim())
  localStorage.setItem(STORAGE_KEYS.MODEL, config.model.trim())
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
    throw new Error(`API key is required for ${PROVIDER_DEFAULTS[provider]?.name || provider}`)
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
        throw new Error(parsed.error?.message || `Gemini API error (${res.status})`)
      } catch (e: any) {
        throw new Error(e.message || `Gemini API error (${res.status}): ${errText.slice(0, 150)}`)
      }
    }

    const data = await res.json()
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = parseLLMJson(contentText)
    return {
      ...parsed,
      providerLabel: `Google Gemini (${model})`,
    }
  }

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

  throw new Error(`Direct browser connection not supported for provider '${provider}'. Use backend or select Gemini / OpenAI.`)
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
