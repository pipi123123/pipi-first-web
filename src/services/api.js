// src/services/api.js
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

async function jfetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=>'')
    throw new Error(txt || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health()             { return jfetch(`${BASE}/api/health`) },
  listPets()           { return jfetch(`${BASE}/api/pets`) },
  createPet(body)      { return jfetch(`${BASE}/api/pets`, { method:'POST', body: JSON.stringify(body) }) },
  updatePet(id, body)  { return jfetch(`${BASE}/api/pets/${id}`, { method:'PUT', body: JSON.stringify(body) }) },
  removePet(id)        { return jfetch(`${BASE}/api/pets/${id}`, { method:'DELETE' }) },
}
