import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Trash2 } from "lucide-react"
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
import { createDish, deleteDish, getDish, getDishes, updateDish, updateDishAvailability, type Dish, type DishPayload } from "../../services/dishService"
import { getApiBase } from "../../services/api"

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
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState("")
  const [isFetchingDish, setIsFetchingDish] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Dish | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [movingDishId, setMovingDishId] = useState<string | null>(null)
  const [missingRestaurant, setMissingRestaurant] = useState(false)
  const [isDeleteImageOpen, setIsDeleteImageOpen] = useState(false)
  const [isDeletingImage, setIsDeletingImage] = useState(false)
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

  const resolveImageUrl = (path: string) => {
    if (path.startsWith("http")) return path
    const base = getApiBase().replace(/\/+$/, "")
    const cleanPath = path.replace(/^\/+/, "")
    return `${base}/${cleanPath}`
  }

  const getFilenameFromUrl = (url: string) => {
    const cleanUrl = url.split("?")[0]
    const parts = cleanUrl.split("/")
    return parts[parts.length - 1]
  }

  const handleDeleteImage = async () => {
    if (!form.imageUrl) return
    const filename = getFilenameFromUrl(form.imageUrl)
    if (!filename) return

    setIsDeletingImage(true)
    setImageError("")
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch(`${getApiBase()}/admin/upload/${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "No se pudo eliminar la imagen.")
      }

      setForm((prev) => ({ ...prev, imageUrl: "" }))
      setImagePreviewUrl(null)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
      setIsDeleteImageOpen(false)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "No se pudo eliminar la imagen.")
    } finally {
      setIsDeletingImage(false)
    }
  }

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
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message) as { message?: string }
            if (parsed?.message === "El usuario no tiene un restaurante creado") {
              setMissingRestaurant(true)
              setError("")
              setDishes([])
              setCategories([{ id: "all", name: "Todas" }])
              setIsFormOpen(false)
              return
            }
          } catch {
            // ignore parse errors
          }
          setError(err.message)
          return
        }
        setError("Error cargando platos.")
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

  const hasCategories = categories.some((cat) => cat.id !== "all")

  const isFormValid = Boolean(
    form.name.trim() &&
    form.description.trim() &&
    form.price.trim() &&
    form.categoryId &&
    hasCategories
  )

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
    setImagePreviewUrl(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
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
      setImagePreviewUrl(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando plato.")
    } finally {
      setIsFetchingDish(false)
    }
  }

  const handleImageFile = async (file: File | null) => {
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

    setImageError("")
    setIsUploadingImage(true)

    try {
      const localPreview = URL.createObjectURL(file)
      setImagePreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) {
          URL.revokeObjectURL(prev)
        }
        return localPreview
      })

      const formData = new FormData()
      formData.append("image", file)
      const token = localStorage.getItem("authToken")

      const response = await fetch(`${getApiBase()}/admin/upload`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "No se pudo subir la imagen.")
      }

      const data = await response.json()
      const uploadItem = Array.isArray(data) ? data[0] : data
      const rawPath = uploadItem?.url || uploadItem?.path || uploadItem?.filename
      if (!rawPath) {
        throw new Error("Respuesta de upload inválida.")
      }

      setForm((prev) => ({ ...prev, imageUrl: resolveImageUrl(String(rawPath)) }))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "No se pudo subir la imagen.")
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ""
      }
    }
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

  const handleMoveCategory = async (dish: Dish, categoryId: string) => {
    if (dish.category_id === categoryId) return
    const payload: DishPayload = {
      name: dish.name,
      description: dish.description,
      price: Number(dish.price) || 0,
      offer_price: dish.offer_price ?? null,
      image_url: dish.image_url ?? null,
      available: dish.available,
      featured: dish.featured,
      tags: Array.isArray(dish.tags) ? dish.tags : [],
      position: Number(dish.position) || 1,
      category_id: categoryId,
    }
    try {
      setMovingDishId(dish.id)
      await updateDish(dish.id, payload)
      setDishes((prev) =>
        prev.map((item) =>
          item.id === dish.id ? { ...item, category_id: categoryId } : item
        )
      )
      setToast("Plato actualizado.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando categoría.")
    } finally {
      setMovingDishId(null)
    }
  }

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
      await Promise.all(
        reordered.map((item) => {
          const payload: DishPayload = {
            name: item.name,
            description: item.description,
            price: Number(item.price) || 0,
            offer_price: item.offer_price ?? null,
            image_url: item.image_url ?? null,
            available: item.available,
            featured: item.featured,
            tags: Array.isArray(item.tags) ? item.tags : [],
            position: item.position ?? 1,
            category_id: item.category_id,
          }
          return updateDish(item.id, payload)
        })
      )
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

          {!missingRestaurant && (
            <button
              onClick={openCreate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto disabled:opacity-60"
              disabled={!hasCategories}
            >
              Crear Plato
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {missingRestaurant && !isLoading && (
          <div className="mb-4 bg-yellow-50 text-yellow-800 px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Primero debes crear tu restaurante para gestionar platos.</span>
            <Link
              to="/admin/restaurant/nuevo"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center"
            >
              Crear restaurante
            </Link>
          </div>
        )}

        {!missingRestaurant && !isLoading && !error && dishes.length === 0 && (
          <div className="mb-4 bg-white p-6 rounded-xl shadow text-gray-600">
            No hay platos creados todavía.
          </div>
        )}

        {!missingRestaurant && !isLoading && !error && !hasCategories && (
          <div className="mb-4 bg-yellow-50 text-yellow-800 px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Primero debes crear al menos una categoría para registrar platos.</span>
            <Link
              to="/admin/categorias"
              state={{ openCreateCategory: Date.now() }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center"
            >
              Crear categoría
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Estamos cargando los platos...
            </div>
            <div className="h-1 w-full bg-blue-100 rounded overflow-hidden">
              <div className="h-full w-full bg-blue-600 animate-pulse" />
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
        {!missingRestaurant && (
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
              disabled={!hasCategories}
            >
              {hasCategories ? (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option value="all">Sin categorías</option>
              )}
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
        )}

        {/* FORM */}
        {isFormOpen && !missingRestaurant && (
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
                  <label className="block text-sm font-medium mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded"
                    maxLength={100}
                    required
                    aria-required="true"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                                {form.name.length}/100
                            </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded min-h-[100px]"
                    maxLength={300}
                    required
                    aria-required="true"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                                {form.description.length}/300
                            </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio <span className="text-red-500">*</span></label>
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
                    required
                    aria-required="true"
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
                  <label className="block text-sm font-medium mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full p-2 border rounded"
                    required
                    aria-required="true"
                    disabled={!hasCategories}
                  >
                    {hasCategories ? (
                      categories.filter((cat) => cat.id !== "all").map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Sin categorías</option>
                    )}
                  </select>
                  {!hasCategories && (
                    <p className="mt-1 text-xs text-yellow-700">
                      Crea una categoría antes de registrar platos.
                    </p>
                  )}
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
                      if (imagePreviewUrl) setImagePreviewUrl(null)
                      if (imageError) setImageError("")
                    }}
                    className={`w-full p-2 border rounded ${imageError ? "border-red-500" : "border-gray-300"}`}
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={(e) => handleImageFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm"
                    disabled={isUploadingImage}
                  />
                  {imageError && (
                    <p className="mt-1 text-sm text-red-600">{imageError}</p>
                  )}
                  {isUploadingImage && (
                    <p className="mt-1 text-sm text-gray-500">Subiendo imagen...</p>
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
                      {imagePreviewUrl || form.imageUrl ? (
                        <img
                          src={imagePreviewUrl || form.imageUrl}
                          alt="Foto del plato"
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            const target = event.currentTarget
                            const currentSrc = target.src
                            if (currentSrc.includes("/storage/")) {
                              target.src = ""
                              return
                            }
                            if (currentSrc.includes("/api/v1/images/")) {
                              target.src = currentSrc.replace("/api/v1/images/", "/images/")
                              return
                            }
                            if (currentSrc.includes("/images/")) {
                              target.src = currentSrc.replace("/images/", "/storage/images/")
                              return
                            }
                            target.src = ""
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Foto</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{form.name || "Nombre del plato"}</p>
                      <p className="text-xs text-gray-500">{form.description || "Descripción"}</p>
                    </div>
                    {(imagePreviewUrl || form.imageUrl) && (
                      <button
                        type="button"
                        onClick={() => setIsDeleteImageOpen(true)}
                        className="ml-auto text-red-600 hover:text-red-700"
                        aria-label="Eliminar imagen"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isFormValid && (
              <p className="mt-4 text-sm text-red-600">
                Completa los campos obligatorios marcados con *.
              </p>
            )}
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
                disabled={isSaving || !isFormValid}
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
        {!missingRestaurant && (
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
                    categories={categories.filter((cat) => cat.id !== "all")}
                    isMoving={movingDishId === dish.id}
                    onEdit={() => openEdit(dish)}
                    onDelete={() => setPendingDelete(dish)}
                    onToggleAvailability={() => handleAvailability(dish)}
                    onMoveCategory={(categoryId) => handleMoveCategory(dish, categoryId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

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

      {isDeleteImageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">
              ¿Eliminar imagen?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteImageOpen(false)}
                className="px-4 py-2 rounded border"
                disabled={isDeletingImage}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteImage}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                disabled={isDeletingImage}
              >
                {isDeletingImage ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function SortableDishCard({
  dish,
  categoryLabel,
  categories,
  isMoving,
  onEdit,
  onDelete,
  onToggleAvailability,
  onMoveCategory,
}: {
  dish: Dish
  categoryLabel: (categoryId: string) => string
  categories: { id: string; name: string }[]
  isMoving: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleAvailability: () => void
  onMoveCategory: (categoryId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: dish.id,
  })
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(dish.image_url ?? null)
  useEffect(() => {
    setCardImageUrl(dish.image_url ?? null)
  }, [dish.image_url])
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
            {cardImageUrl ? (
              <img
                src={cardImageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
                onError={() => {
                  if (cardImageUrl.includes("/storage/")) {
                    setCardImageUrl(null)
                    return
                  }
                  if (cardImageUrl.includes("/api/v1/images/")) {
                    setCardImageUrl(cardImageUrl.replace("/api/v1/images/", "/images/"))
                    return
                  }
                  if (cardImageUrl.includes("/images/")) {
                    setCardImageUrl(cardImageUrl.replace("/images/", "/storage/images/"))
                    return
                  }
                  setCardImageUrl(null)
                }}
              />
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

      <div className="mt-2">
        <label className="block text-xs text-gray-500 mb-1">Mover a categoría</label>
        <select
          value={dish.category_id}
          onChange={(event) => onMoveCategory(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="w-full p-2 border rounded text-sm"
          disabled={isMoving}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
