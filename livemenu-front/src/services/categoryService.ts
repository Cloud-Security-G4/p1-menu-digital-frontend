import { apiFetch } from "./api"

export type CategoryPayload = {
    name: string
    description: string
    position: number
    active: boolean
}

export type Category = CategoryPayload & {
    id: string
}

export async function getCategories() {
    return apiFetch("/admin/categories", {
        method: "GET",
    })
}

export async function createCategory(payload: CategoryPayload) {
    return apiFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateCategory(id: string, payload: CategoryPayload) {
    return apiFetch(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    })
}

export async function reorderCategories(categories: { id: string; position: number }[]) {
    return apiFetch("/admin/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ categories }),
    })
}

export async function deleteCategory(id: string) {
    return apiFetch(`/admin/categories/${id}`, {
        method: "DELETE",
    })
}
