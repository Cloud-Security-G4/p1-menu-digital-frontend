import { apiFetch } from "./api"

export async function login(email: string, password: string) {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  })
}
