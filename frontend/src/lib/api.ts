import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Cases ─────────────────────────────────────────────────────
export const casesApi = {
  list: (params?: Record<string, string | number>) => api.get('/cases', { params }),
  get: (id: string) => api.get(`/cases/${id}`),
  create: (data: Record<string, unknown>) => api.post('/cases', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/cases/${id}`, data),
  delete: (id: string) => api.delete(`/cases/${id}`),
}

// ── Evidence ──────────────────────────────────────────────────
export const evidenceApi = {
  list: (caseId: string) => api.get(`/evidence/${caseId}`),
  get: (id: string) => api.get(`/evidence/item/${id}`),
  upload: (formData: FormData) =>
    api.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getCustody: (evidenceId: string) => api.get(`/evidence/item/${evidenceId}/custody`),
  verify: (evidenceId: string) => api.get(`/evidence/item/${evidenceId}/verify`),
  delete: (evidenceId: string) => api.delete(`/evidence/item/${evidenceId}`),
}

// ── Graph ─────────────────────────────────────────────────────
export const graphApi = {
  build: (caseId: string) => api.post(`/graph/build/${caseId}`),
  get: (caseId: string) => api.get(`/graph/${caseId}`),
  getCommunities: (caseId: string) => api.get(`/graph/${caseId}/communities`),
  getPaths: (caseId: string, source: string, target: string) =>
    api.get(`/graph/${caseId}/paths`, { params: { source, target } }),
}

// ── Analytics ─────────────────────────────────────────────────
export const analyticsApi = {
  runAnomaly: (caseId: string) => api.post(`/analytics/anomaly/${caseId}`),
  getAnomalies: (caseId: string) => api.get(`/analytics/anomaly/${caseId}`),
  runRisk: (caseId: string) => api.post(`/analytics/risk/${caseId}`),
  getRiskScores: (caseId: string) => api.get(`/analytics/risk/${caseId}`),
  getSimilarity: (caseId: string) => api.post(`/analytics/similarity/${caseId}`),
}

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  investigate: (caseId: string, data: Record<string, unknown>) =>
    api.post(`/ai/investigate/${caseId}`, data),
  generateNarrative: (caseId: string) => api.post(`/ai/report/${caseId}`),
}

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  generate: (caseId: string, data: Record<string, unknown>) =>
    api.post(`/reports/generate/${caseId}`, data),
  list: (caseId: string) => api.get(`/reports/${caseId}`),
  download: (reportId: string) =>
    api.get(`/reports/download/${reportId}`, { responseType: 'blob' }),
  delete: (reportId: string) => api.delete(`/reports/${reportId}`),
}

// ── Health ────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health'),
}
