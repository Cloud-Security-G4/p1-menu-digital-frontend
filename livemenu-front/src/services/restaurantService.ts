import { apiFetch } from "./api"

export type RestaurantPayload = {
    name: string
    description: string
    phone: string
    address: string
    hours: Record<string, { open: string; close: string }[]>
    logo: string | null
}

export type Restaurant = RestaurantPayload & {
    id: string
    email?: string
    slug?: string
}

export async function getRestaurants() {
    return apiFetch("/admin/restaurant", {
        method: "GET",
    })
}

export async function createRestaurant(payload: RestaurantPayload) {
    return apiFetch("/admin/restaurant", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateRestaurant(id: string, payload: RestaurantPayload) {
    return apiFetch(`/admin/restaurant?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    })
}

export async function deleteRestaurant(id: string) {
    return apiFetch(`/admin/restaurant/${encodeURIComponent(id)}`, {
        method: "DELETE",
    })
}
