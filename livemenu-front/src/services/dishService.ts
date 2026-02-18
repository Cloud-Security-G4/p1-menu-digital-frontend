import { apiFetch } from "./api"

export type DishPayload = {
    name: string
    description: string
    price: number
    offer_price?: number | null
    image_url?: string | null
    available: boolean
    featured: boolean
    tags: string[]
    position: number
    category_id: string
}

export type Dish = DishPayload & {
    id: string
}

export async function getDishes() {
    return apiFetch("/admin/dishes", { method: "GET" })
}

export async function getDish(id: string) {
    return apiFetch(`/admin/dishes/${id}`, { method: "GET" })
}

export async function createDish(payload: DishPayload) {
    return apiFetch("/admin/dishes", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateDish(id: string, payload: DishPayload) {
    return apiFetch(`/admin/dishes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    })
}

export async function deleteDish(id: string) {
    return apiFetch(`/admin/dishes/${id}`, {
        method: "DELETE",
    })
}

export async function reorderDishes(dishes: { id: string; position: number }[]) {
    return apiFetch("/admin/dishes/reorder", {
        method: "PUT",
        body: JSON.stringify({ dishes }),
    })
}

export async function updateDishAvailability(id: string, payload: DishPayload) {
    return apiFetch(`/admin/dishes/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    })
}
