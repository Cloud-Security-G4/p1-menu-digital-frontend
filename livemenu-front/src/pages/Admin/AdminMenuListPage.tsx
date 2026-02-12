import { useEffect, useMemo, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import { dishMock, type DishMock } from "../../mocks/dishMock"

export default function AdminMenuListPage() {
  const categories = [
    { id: "all", name: "Todas" },
    { id: "cat-01", name: "Clásicos" },
    { id: "cat-02", name: "Marinos" },
    { id: "cat-03", name: "Bebidas" },
  ]

  const [dishes, setDishes] = useState<DishMock[]>([])
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [showDeleted, setShowDeleted] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DishMock>({
    id: "",
    name: "",
    description: "",
    price: 0,
    categoryId: "cat-01",
    available: true,
    imageUrl: "",
  })
  const [imageError, setImageError] = useState("")

  const normalizeDishes = (items: DishMock[]) =>
    items.map((item) => ({
      id: String(item.id || `d-${Date.now()}`),
      name: typeof item.name === "string" ? item.name : "",
      description: typeof item.description === "string" ? item.description : "",
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      categoryId: typeof item.categoryId === "string" ? item.categoryId : "cat-01",
      available: typeof item.available === "boolean" ? item.available : true,
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : "",
      isDeleted: Boolean(item.isDeleted),
    }))

  useEffect(() => {
    const stored = localStorage.getItem("dishes")
    console.log("[Platos] localStorage dishes:", stored)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DishMock[]
        const hasItems = Array.isArray(parsed) && parsed.length > 0
        const normalized = hasItems ? normalizeDishes(parsed) : normalizeDishes(dishMock)
        console.log("[Platos] parsed dishes:", parsed)
        console.log("[Platos] normalized dishes:", normalized)
        setDishes(normalized)
        return
      } catch {
        console.log("[Platos] parse error, fallback to mock")
        setDishes(normalizeDishes(dishMock))
        return
      }
    }
    console.log("[Platos] no localStorage, using mock:", dishMock)
    setDishes(normalizeDishes(dishMock))
  }, [])

  useEffect(() => {
    localStorage.setItem("dishes", JSON.stringify(dishes))
  }, [dishes])

  const filteredDishes = useMemo(() => {
    const result = dishes.filter((dish) => {
      if (!showDeleted && dish.isDeleted) return false
      if (categoryFilter !== "all" && dish.categoryId !== categoryFilter) return false
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
    console.log("[Platos] filtered dishes:", result.length, result)
    return result
  }, [dishes, query, categoryFilter, availabilityFilter, showDeleted])

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      description: "",
      price: 0,
      categoryId: "cat-01",
      available: true,
      imageUrl: "",
    })
    setEditingId(null)
    setImageError("")
  }

  const openCreate = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEdit = (dish: DishMock) => {
    setForm({ ...dish })
    setEditingId(dish.id)
    setIsFormOpen(true)
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

  const handleSave = () => {
    if (!form.name.trim()) return
    if (!form.description.trim()) return
    const payload = {
      ...form,
      id: editingId || `d-${Date.now()}`,
      isDeleted: false,
    }
    const updated = editingId
      ? dishes.map((dish) => (dish.id === editingId ? payload : dish))
      : [...dishes, payload]
    setDishes(updated)
    setIsFormOpen(false)
    resetForm()
  }

  const handleDelete = (dishId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId ? { ...dish, isDeleted: true } : dish
      )
    )
  }

  const handleRestore = (dishId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId ? { ...dish, isDeleted: false } : dish
      )
    )
  }

  const handleAvailability = (dishId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId ? { ...dish, available: !dish.available } : dish
      )
    )
  }

  const handleMoveCategory = (dishId: string, categoryId: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === dishId ? { ...dish, categoryId } : dish
      )
    )
  }

  const categoryLabel = (categoryId: string) =>
    categories.find((cat) => cat.id === categoryId)?.name || "Sin categoría"

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

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción"
            className="p-2 border rounded"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Mostrar eliminados
          </label>
        </div>

        {/* FORM */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Editar plato" : "Nuevo plato"}
            </h2>
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
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
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

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="bg-white p-5 rounded-xl shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Foto</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{dish.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{dish.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{categoryLabel(dish.categoryId)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${dish.available ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                  {dish.available ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold">Precio: ${dish.price.toFixed(2)}</span>
                <button
                  onClick={() => handleAvailability(dish.id)}
                  className="text-blue-600 hover:underline"
                >
                  Cambiar disponibilidad
                </button>
              </div>

              <div className="mt-3">
                <label className="text-xs text-gray-500">Mover a categoría</label>
                <select
                  value={dish.categoryId}
                  onChange={(e) => handleMoveCategory(dish.id, e.target.value)}
                  className="mt-1 w-full p-2 border rounded text-sm"
                >
                  {categories.filter((cat) => cat.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex gap-3 text-sm">
                <button
                  onClick={() => openEdit(dish)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                {dish.isDeleted ? (
                  <button
                    onClick={() => handleRestore(dish.id)}
                    className="text-green-600 hover:underline"
                  >
                    Restaurar
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  )
}
