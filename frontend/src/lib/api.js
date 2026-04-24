const getToken = () => localStorage.getItem('token')

export async function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
