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
import { getCategories } from "../../services/categoryService"
import { createDish, deleteDish, getDish, getDishes, reorderDishes, updateDish, updateDishAvailability, type Dish, type DishPayload } from "../../services/dishService"

// Dishes admin: list, filters, and CRUD UI
export default function AdminMenuListPage() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "all", name: "Todas" },
  ])

  const [dishes, setDishes] = useState<Dish[]>([])
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    offerPrice: "",
    categoryId: "",
    available: true,
    featured: false,
    imageUrl: "",
    tagsText: "",
    position: 1,
  })
  const [imageError, setImageError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState("")
  const [isFetchingDish, setIsFetchingDish] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Dish | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState("")
  const location = useLocation()

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(""), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const resetSignal = (location.state as { resetPlatesView?: number } | null)?.resetPlatesView
    if (!resetSignal) return
    setIsFormOpen(false)
    setEditingId(null)
    resetForm()
  }, [location.state])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const normalizeDish = (item: Dish) => ({
    ...item,
    price: Number(item.price) || 0,
    offer_price: item.offer_price != null ? Number(item.offer_price) : null,
    image_url: item.image_url ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    position: Number(item.position) || 1,
  })

  const loadData = async () => {
      try {
        setIsLoading(true)
        const [dishData, categoryData] = await Promise.all([
          getDishes(),
          getCategories(),
        ])
        const items = Array.isArray(dishData)
          ? dishData
          : Array.isArray(dishData?.data)
            ? dishData.data
            : dishData?.id
              ? [dishData]
              : []
        const mapped = items.map((item: Dish) => ({
          ...normalizeDish(item),
        }))
        setDishes(mapped)
        const cats = Array.isArray(categoryData)
          ? categoryData
          : Array.isArray(categoryData?.data)
            ? categoryData.data
            : categoryData?.id
              ? [categoryData]
              : []
        setCategories([{ id: "all", name: "Todas" }, ...cats.map((c: any) => ({ id: c.id, name: c.name }))])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando platos.")
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    loadData()
  }, [])

  const orderedDishes = useMemo(() => {
    return [...dishes].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }, [dishes])

  const filteredDishes = useMemo(() => {
    const result = orderedDishes.filter((dish) => {
      if (categoryFilter !== "all" && dish.category_id !== categoryFilter) return false
      if (availabilityFilter !== "all") {
        const target = availabilityFilter === "available"
        if (dish.available !== target) return false
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const name = (dish.name || "").toLowerCase()
        const description = (dish.description || "").toLowerCase()
        if (!name.includes(q) && !description.includes(q)) {
          return false
        }
      }
      return true
    })
    return result
  }, [orderedDishes, query, categoryFilter, availabilityFilter])

  const resetForm = () => {
    const defaultCategory = categories.find((cat) => cat.id !== "all")?.id || ""
    setForm({
      id: "",
      name: "",
      description: "",
      price: "",
      offerPrice: "",
      categoryId: defaultCategory,
      available: true,
      featured: false,
      imageUrl: "",
      tagsText: "",
      position: 1,
    })
    setEditingId(null)
    setImageError("")
  }

  const openCreate = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEdit = async (dish: Dish) => {
    setEditingId(dish.id)
    setIsFormOpen(true)
    setIsFetchingDish(true)
    try {
      const data = await getDish(dish.id)
      const normalized = normalizeDish(data?.id ? data : dish)
      setForm({
        id: normalized.id,
        name: normalized.name,
        description: normalized.description,
        price: String(normalized.price ?? ""),
        offerPrice: normalized.offer_price != null ? String(normalized.offer_price) : "",
        categoryId: normalized.category_id,
        available: normalized.available,
        featured: normalized.featured,
        imageUrl: normalized.image_url ?? "",
        tagsText: (normalized.tags || []).join(", "),
        position: normalized.position ?? 1,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando plato.")
    } finally {
      setIsFetchingDish(false)
    }
  }

  const handleImageFile = (file: File | null) => {
    if (!file) return
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setImageError("La imagen no debe superar 5MB.")
      return
    }
    if (!file.type.startsWith("image/")) {
      setImageError("El archivo debe ser una imagen.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (result) {
        setImageError("")
        setForm((prev) => ({ ...prev, imageUrl: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (!form.description.trim()) return
    const tags = form.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    const payload: DishPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      offer_price: form.offerPrice ? Number(form.offerPrice) : null,
      image_url: form.imageUrl || null,
      available: form.available,
      featured: form.featured,
      tags,
      position: Number(form.position) || 1,
      category_id: form.categoryId,
    }
    try {
      setIsSaving(true)
      if (editingId) {
        await updateDish(editingId, payload)
      } else {
        await createDish(payload)
      }
      await loadData()
      setIsFormOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando plato.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      setIsDeleting(true)
      await deleteDish(pendingDelete.id)
      await loadData()
      setPendingDelete(null)
      setToast("Eliminado correctamente.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminando plato.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAvailability = async (dish: Dish) => {
    const payload: DishPayload = {
      name: dish.name,
      description: dish.description,
      price: Number(dish.price) || 0,
      offer_price: dish.offer_price ?? null,
      image_url: dish.image_url ?? null,
      available: !dish.available,
      featured: dish.featured,
      tags: Array.isArray(dish.tags) ? dish.tags : [],
      position: Number(dish.position) || 1,
      category_id: dish.category_id,
    }
    try {
      await updateDishAvailability(dish.id, payload)
      setDishes((prev) =>
        prev.map((item) =>
          item.id === dish.id ? { ...item, available: payload.available } : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando disponibilidad.")
    }
  }

  // const handleMoveCategory = (dishId: string, categoryId: string) => {
  //   setDishes((prev) =>
  //     prev.map((dish) =>
  //       dish.id === dishId ? { ...dish, category_id: categoryId } : dish
  //     )
  //   )
  // }

  const categoryLabel = (categoryId: string) =>
    categories.find((cat) => cat.id === categoryId)?.name || "Sin categoría"

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const current = [...filteredDishes]
    const oldIndex = current.findIndex((item) => item.id === activeId)
    const newIndex = current.findIndex((item) => item.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(current, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index + 1,
    }))

    setDishes((prev) =>
      prev.map((dish) => {
        const match = reordered.find((item) => item.id === dish.id)
        return match ? { ...dish, position: match.position } : dish
      })
    )

    try {
      setIsReordering(true)
      await reorderDishes(reordered.map((item) => ({ id: item.id, position: item.position })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando el orden.")
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <AdminLayout>
      <div>

        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Platos</h1>

          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto"
          >
            Crear Plato
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
              Estamos cargando los platos...
            </div>
            <div className="h-1 w-full bg-blue-100 rounded overflow-hidden">
              <div className="h-full w-1/2 bg-blue-600 animate-pulse" />
            </div>
          </div>
        )}

        {toast && (
          <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded">
            {toast}
          </div>
        )}

        {isReordering && (
          <div className="mb-4 text-sm text-gray-600">
            Reordenando platos...
          </div>
        )}

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o descripción"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Disponibilidad</label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No disponibles</option>
            </select>
          </div>
          {/* <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Mostrar eliminados
          </label> */}
        </div>

        {/* FORM */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Editar plato" : "Nuevo plato"}
            </h2>
            {isFetchingDish && (
              <div className="mb-4 text-sm text-gray-600">
                Cargando información del plato...
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded min-h-[100px]"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\\d*"
                    value={form.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setForm((prev) => ({ ...prev, price: value }))
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio oferta</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\\d*"
                    value={form.offerPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "")
                      setForm((prev) => ({ ...prev, offerPrice: value }))
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    {categories.filter((cat) => cat.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm((prev) => ({ ...prev, available: e.target.checked }))}
                  />
                  Disponible
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                  />
                  Destacado
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">Posición</label>
                  <input
                    type="number"
                    min="1"
                    value={form.position}
                    onChange={(e) => setForm((prev) => ({ ...prev, position: Number(e.target.value) }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Foto (URL o archivo)</label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                      if (imageError) setImageError("")
                    }}
                    className={`w-full p-2 border rounded ${imageError ? "border-red-500" : "border-gray-300"}`}
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm"
                  />
                  {imageError && (
                    <p className="mt-1 text-sm text-red-600">{imageError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (separados por coma)</label>
                  <input
                    type="text"
                    value={form.tagsText}
                    onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                    className="w-full p-2 border rounded"
                    placeholder="carne, popular, sin gluten"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-medium mb-2">Vista previa</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded overflow-hidden flex items-center justify-center">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="Foto del plato" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-400">Foto</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{form.name || "Nombre del plato"}</p>
                      <p className="text-xs text-gray-500">{form.description || "Descripción"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar"}
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

        {/* CARDS */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredDishes.map((dish) => dish.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => (
                <SortableDishCard
                  key={dish.id}
                  dish={dish}
                  categoryLabel={categoryLabel}
                  onEdit={() => openEdit(dish)}
                  onDelete={() => setPendingDelete(dish)}
                  onToggleAvailability={() => handleAvailability(dish)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-2">
                ¿Eliminar plato?
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

function SortableDishCard({
  dish,
  categoryLabel,
  onEdit,
  onDelete,
  onToggleAvailability,
}: {
  dish: Dish
  categoryLabel: (categoryId: string) => string
  onEdit: () => void
  onDelete: () => void
  onToggleAvailability: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: dish.id,
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
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
            {dish.image_url ? (
              <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">Foto</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{dish.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{dish.description}</p>
            <p className="text-xs text-gray-500 mt-1">{categoryLabel(dish.category_id)}</p>
            {dish.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {dish.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={`${dish.id}-tag-${index}`}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${dish.available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
          {dish.available ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold">Precio: ${dish.price.toFixed(2)}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Disponibilidad</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleAvailability()
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${dish.available ? "bg-blue-600" : "bg-gray-300"}`}
            role="switch"
            aria-checked={dish.available}
            aria-label="Cambiar disponibilidad"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${dish.available ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        <span className="text-xs text-gray-500">Categoría:</span>{" "}
        {categoryLabel(dish.category_id)}
      </div>

      <div className="mt-4 flex gap-3 text-sm">
        <button
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          className="text-blue-600 hover:underline"
        >
          Editar
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="text-red-600 hover:underline"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
