import { useEffect, useMemo, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import { categoryMock, type CategoryMock } from "../../mocks/categoryMock"
import type { DishMock } from "../../mocks/dishMock"

type CategoryForm = {
    name: string
    description: string
    position: number
}

const categoryStorageKey = "categories"
const cacheKey = "categoriesCacheUpdatedAt"

const normalizeCategories = (items: CategoryMock[]) =>
    items.map((item, index) => ({
        id: String(item.id || `cat-${Date.now()}-${index}`),
        name: typeof item.name === "string" ? item.name : "",
        description: typeof item.description === "string" ? item.description : "",
        position: Number.isFinite(Number(item.position)) ? Number(item.position) : index + 1,
    }))

const loadCategories = () => {
    const stored = localStorage.getItem(categoryStorageKey)
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as CategoryMock[]
            if (Array.isArray(parsed) && parsed.length > 0) {
                return normalizeCategories(parsed)
            }
        } catch {
            return normalizeCategories(categoryMock)
        }
    }
    return normalizeCategories(categoryMock)
}

const loadDishes = () => {
    const stored = localStorage.getItem("dishes")
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as DishMock[]
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

export default function AdminCategoryPage() {
    const [categories, setCategories] = useState<CategoryMock[]>([])
    const [dishes, setDishes] = useState<DishMock[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<CategoryForm>({
        name: "",
        description: "",
        position: 1,
    })
    const [error, setError] = useState("")

    useEffect(() => {
        setCategories(loadCategories())
        setDishes(loadDishes())
    }, [])

    useEffect(() => {
        localStorage.setItem(categoryStorageKey, JSON.stringify(categories))
        localStorage.setItem(cacheKey, new Date().toISOString())
    }, [categories])

    const orderedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.position - b.position)
    }, [categories])

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            position: categories.length + 1,
        })
        setEditingId(null)
        setError("")
    }

    const openCreate = () => {
        resetForm()
        setIsFormOpen(true)
    }

    const openEdit = (category: CategoryMock) => {
        setForm({
            name: category.name,
            description: category.description,
            position: category.position,
        })
        setEditingId(category.id)
        setIsFormOpen(true)
    }

    const handleSave = () => {
        if (!form.name.trim()) {
            setError("El nombre es obligatorio.")
            return
        }

        const payload: CategoryMock = {
            id: editingId || `cat-${Date.now()}`,
            name: form.name.trim(),
            description: form.description.trim(),
            position: Number(form.position) || 1,
        }

        const updated = editingId
            ? categories.map((cat) => (cat.id === editingId ? payload : cat))
            : [...categories, payload]

        setCategories(updated)
        setIsFormOpen(false)
        resetForm()
    }

    const handleDelete = (categoryId: string) => {
        const hasDishes = dishes.some((dish) => dish.categoryId === categoryId && !dish.isDeleted)
        if (hasDishes) {
            setError("No se puede eliminar: hay platos asociados.")
            return
        }
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold">Categorías</h1>
                    <button
                        onClick={openCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto"
                    >
                        Nueva categoría
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

                {isFormOpen && (
                    <div className="bg-white p-6 rounded-xl shadow mb-6">
                        <h2 className="text-lg font-semibold mb-4">
                            {editingId ? "Editar categoría" : "Crear categoría"}
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => {
                                        setForm((prev) => ({ ...prev, name: e.target.value }))
                                        if (error) setError("")
                                    }}
                                    className="w-full p-2 border rounded"
                                    maxLength={100}
                                />
                            </div>
                            {/* <div>
                                <label className="block text-sm font-medium mb-1">Orden</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.position}
                                    onChange={(e) => setForm((prev) => ({ ...prev, position: Number(e.target.value) }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div> */}
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Descripción</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                className="w-full p-2 border rounded min-h-[96px]"
                                maxLength={500}
                            />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Guardar
                            </button>
                            <button
                                onClick={() => {
                                    setIsFormOpen(false)
                                    resetForm()
                                }}
                                className="px-4 py-2 rounded border"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {orderedCategories.map((category) => (
                        <div key={category.id} className="bg-white p-5 rounded-xl shadow">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {category.description || "Sin descripción"}
                                    </p>
                                </div>
                                {/* <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                    Orden {category.position}
                                </span> */}
                            </div>

                            <div className="mt-4 flex gap-3 text-sm">
                                <button
                                    onClick={() => openEdit(category)}
                                    className="text-blue-600 hover:underline"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
