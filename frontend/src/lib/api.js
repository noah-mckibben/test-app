const BASE = ''

export function api(path, options = {}) {
  const token = localStorage.getItem('token')
  return fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
