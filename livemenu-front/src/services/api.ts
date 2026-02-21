// prueba asumiendo localhost:8000
const API_URL = import.meta.env.VITE_API_URL
const API_HOST =
  import.meta.env.VITE_API_HOST ||
  "http://127.0.0.1:8000"
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api/v1"

const joinUrl = (host: string, prefix: string) => {
  const cleanHost = host.replace(/\/+$/, "")
  const cleanPrefix = `/${prefix.replace(/^\/+/, "")}`
  return `${cleanHost}${cleanPrefix}`
}

const normalizeBase = (baseUrl: string, prefix: string) => {
  const cleanBase = baseUrl.replace(/\/+$/, "")
  let cleanPrefix = `/${prefix.replace(/^\/+/, "")}`

  if (cleanBase.endsWith("/api") && cleanPrefix.startsWith("/api/")) {
    cleanPrefix = cleanPrefix.replace(/^\/api/, "")
  }

  return cleanBase.endsWith(cleanPrefix) ? cleanBase : `${cleanBase}${cleanPrefix}`
}

const API_BASE = API_URL
  ? normalizeBase(API_URL, API_PREFIX)
  : joinUrl(API_HOST, API_PREFIX)
const FALLBACK_BASE = joinUrl("http://127.0.0.1:8000", API_PREFIX)

export function getApiBase() {
  const base = API_BASE.startsWith("http") ? API_BASE : FALLBACK_BASE
  if (base !== API_BASE) {
    console.warn("[apiFetch] API_BASE invalido, usando fallback:", API_BASE, FALLBACK_BASE)
  }
  return base
}

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const base = getApiBase()
  const token = localStorage.getItem("authToken")

  const response = await fetch(`${base}${endpoint}`, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "API Error")
  }

  return response.json()
}


// export async function testEndpoint() {
//     const response = await fetch("https://jsonplaceholder.typicode.com/users")
  
//     if (!response.ok) {
//       throw new Error("Error calling API")
//     }
  
//     return response.json()
//   }
  
  