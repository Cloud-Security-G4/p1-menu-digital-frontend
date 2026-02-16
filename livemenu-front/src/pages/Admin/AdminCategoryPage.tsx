import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import AdminLayout from "../../components/layout/AdminLayout"
import { createCategory, deleteCategory, getCategories, reorderCategories, updateCategory, type Category } from "../../services/categoryService"

type CategoryForm = {
    name: string
    description: string
    position: number
    active: boolean
}

const normalizeCategories = (items: Category[]) =>
    items.map((item, index) => ({
        id: String(item.id || `cat-${Date.now()}-${index}`),
        name: typeof item.name === "string" ? item.name : "",
        description: typeof item.description === "string" ? item.description : "",
        position: Number.isFinite(Number(item.position)) ? Number(item.position) : index + 1,
        active: typeof item.active === "boolean" ? item.active : true,
    }))

// Categories admin
export default function AdminCategoryPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<CategoryForm>({
        name: "",
        description: "",
        position: 1,
        active: true,
    })
    const [error, setError] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isReordering, setIsReordering] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const location = useLocation()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                const data = await getCategories()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                setCategories(normalizeCategories(items))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error cargando categorías.")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        const resetSignal = (location.state as { resetCategoriesView?: number } | null)?.resetCategoriesView
        if (!resetSignal) return
        setIsFormOpen(false)
        setEditingId(null)
        resetForm()
    }, [location.state])

    const orderedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.position - b.position)
    }, [categories])

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            position: categories.length + 1,
            active: true,
        })
        setEditingId(null)
        setError("")
    }

    const openCreate = () => {
        resetForm()
        setIsFormOpen(true)
    }

    const openEdit = (category: Category) => {
        setForm({
            name: category.name,
            description: category.description,
            position: category.position,
            active: category.active ?? true,
        })
        setEditingId(category.id)
        setIsFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError("El nombre es obligatorio.")
            return
        }

        try {
            setIsSaving(true)
            if (editingId) {
                const payload = {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    position: Number(form.position) || 1,
                    active: form.active,
                }
                const updatedRemote = await updateCategory(editingId, payload)
                const updatedItem = updatedRemote?.id
                    ? updatedRemote
                    : { id: editingId, ...payload }
                setCategories((prev) =>
                    normalizeCategories(prev.map((cat) => (cat.id === editingId ? updatedItem : cat)))
                )
            } else {
                const payload = {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    position: Number(form.position) || 1,
                    active: form.active,
                }
                const created = await createCategory(payload)
                const item = created?.id
                    ? created
                    : { id: `cat-${Date.now()}`, ...payload }
                setCategories((prev) => normalizeCategories([...prev, item]))
            }
            setIsFormOpen(false)
            resetForm()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error guardando categoría.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const current = [...orderedCategories]
        const activeId = String(active.id)
        const overId = String(over.id)
        const oldIndex = current.findIndex((item) => item.id === activeId)
        const newIndex = current.findIndex((item) => item.id === overId)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(current, oldIndex, newIndex).map((item, index) => ({
            ...item,
            position: index + 1,
        }))

        setCategories(reordered)

        try {
            setIsReordering(true)
            await reorderCategories(
                reordered.map((item) => ({
                    id: item.id,
                    position: item.position,
                }))
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error actualizando el orden.")
        } finally {
            setIsReordering(false)
        }
    }

    const handleDelete = async () => {
        if (!pendingDelete) return
        try {
            setIsDeleting(true)
            await deleteCategory(pendingDelete.id)
            setCategories((prev) => prev.filter((cat) => cat.id !== pendingDelete.id))
            setPendingDelete(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error eliminando categoría.")
        } finally {
            setIsDeleting(false)
        }
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

                {isLoading && (
                    <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                            Estamos cargando las categorías...
                        </div>
                        <div className="h-1 w-full bg-blue-100 rounded overflow-hidden">
                            <div className="h-full w-1/2 bg-blue-600 animate-pulse" />
                        </div>
                    </div>
                )}

                {isReordering && (
                    <div className="mb-4 text-sm text-gray-600">
                        Reordenando categorías...
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
                            <div>
                                <label className="block text-sm font-medium mb-1">Orden</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.position}
                                    onChange={(e) => setForm((prev) => ({ ...prev, position: Number(e.target.value) }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
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

                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            Activa
                        </label>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
                                disabled={isSaving}
                            >
                                <span className="inline-flex items-center gap-2">
                                    {isSaving && (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    )}
                                    Guardar
                                </span>
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

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={orderedCategories.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {orderedCategories.map((category) => (
                                <SortableCategoryCard
                                    key={category.id}
                                    category={category}
                                    onEdit={() => openEdit(category)}
                                    onDelete={() => setPendingDelete(category)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {pendingDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                            <h3 className="text-lg font-semibold mb-2">
                                ¿Eliminar categoría?
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Esta acción no se puede deshacer. Se eliminará
                                <span className="font-medium"> {pendingDelete.name}</span>.
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setPendingDelete(null)}
                                    className="px-4 py-2 rounded border"
                                    disabled={isDeleting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Eliminando..." : "Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

function SortableCategoryCard({
    category,
    onEdit,
    onDelete,
}: {
    category: Category
    onEdit: () => void
    onDelete: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: category.id,
    })
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-5 rounded-xl shadow cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description || "Sin descripción"}
                    </p>
                </div>
                <span
                    className={`text-xs px-2 py-1 rounded ${category.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                >
                    {category.active ? "Activa" : "Inactiva"}
                </span>
            </div>

            <div className="mt-4 flex gap-3 text-sm">
                <button
                    onClick={onEdit}
                    className="text-blue-600 hover:underline"
                >
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className="text-red-600 hover:underline"
                >
                    Eliminar
                </button>
            </div>
        </div>
    )
}
