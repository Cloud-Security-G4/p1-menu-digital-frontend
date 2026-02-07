// prueba asumiendo localhost:8000

const API_BASE = import.meta.env.VITE_API_URL

export async function apiFetch(endpoint: string, options?: RequestInit) {

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    throw new Error("API Error")
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
  
  