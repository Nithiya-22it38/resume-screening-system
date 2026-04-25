import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for AI screening calls
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireiq_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hireiq_token')
      localStorage.removeItem('hireiq_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ── Jobs ──────────────────────────────────────────────
export const jobsApi = {
  list: (params?: { status?: string; department?: string }) =>
    api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: unknown) => api.post('/jobs', data),
  update: (id: string, data: unknown) => api.put(`/jobs/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/jobs/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/jobs/${id}`),
}

// ── Resumes ───────────────────────────────────────────
export const resumesApi = {
  list: (params?: { jobId?: string; status?: string }) =>
    api.get('/resumes', { params }),
  get: (id: string) => api.get(`/resumes/${id}`),
  upload: (formData: FormData) =>
    api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/resumes/${id}/status`, { status, notes }),
  delete: (id: string) => api.delete(`/resumes/${id}`),
}

// ── Screening ─────────────────────────────────────────
export const screeningApi = {
  screenOne: (resumeId: string) =>
    api.post(`/screening/resume/${resumeId}`),
  screenBatch: (jobId: string) =>
    api.post(`/screening/batch/${jobId}`),
  getResult: (resumeId: string) =>
    api.get(`/screening/result/${resumeId}`),
  compare: (jobId: string) =>
    api.post(`/screening/compare/${jobId}`),
  getStatus: (jobId: string) =>
    api.get(`/screening/status/${jobId}`),
}

// ── Analytics ─────────────────────────────────────────
export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  job: (jobId: string) => api.get(`/analytics/job/${jobId}`),
}
