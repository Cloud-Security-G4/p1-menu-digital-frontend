import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { getApiBase } from "../services/api"

type MenuItem = {
  id?: string | number
  name?: string
  description?: string
  price?: number | string
  offer_price?: number | string | null
  image_url?: string | null
  imageUrl?: string | null
  available?: boolean
  featured?: boolean
  tags?: string[]
  category_id?: string
  categoryId?: string
}

type MenuCategory = {
  id?: string | number
  name?: string
  description?: string
  dishes?: MenuItem[]
  items?: MenuItem[]
  products?: MenuItem[]
}

type MenuRestaurant = {
  name?: string
  description?: string
  logo?: string | null
  phone?: string
  address?: string
  hours?: Record<string, { open: string; close: string }[]>
}

type MenuSection = {
  id: string
  name: string
  description?: string
  items: MenuItem[]
}

// Turn category names into safe keys
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")

// Format numbers as menu prices
const formatPrice = (value: MenuItem["price"]) => {
  const numeric = typeof value === "string" ? Number(value) : value
  if (numeric == null || Number.isNaN(Number(numeric))) return ""
  return Number(numeric).toFixed(2)
}

// Build absolute URL for images
const resolveImageUrl = (path?: string | null) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const base = getApiBase().replace(/\/api\/v1\/?$/, "")
  const cleanPath = path.replace(/^\/+/, "")
  return `${base}/${cleanPath}`
}

const DEFAULT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>" +
      "<rect width='160' height='160' fill='#f2e9dd'/>" +
      "<circle cx='80' cy='80' r='52' fill='#fff' stroke='#e3d6c3' stroke-width='4'/>" +
      "<circle cx='80' cy='80' r='32' fill='#f6f1ea' stroke='#e3d6c3' stroke-width='2'/>" +
      "<path d='M45 118c10 6 25 10 35 10s25-4 35-10' fill='none' stroke='#cbbba6' stroke-width='4' stroke-linecap='round'/>" +
    "</svg>"
  )

// Try alternate public paths if image fails
const applyImageFallback = (target: HTMLImageElement) => {
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
}

export default function PublicMenuPage() {
  const { slug } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [restaurant, setRestaurant] = useState<MenuRestaurant | null>(null)
  const [sections, setSections] = useState<MenuSection[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")

  const menuTitle = useMemo(() => restaurant?.name || "Menú", [restaurant?.name])
  const visibleSections = useMemo(() => {
    if (activeCategoryId === "all") return sections
    return sections.filter((section) => section.id === activeCategoryId)
  }, [activeCategoryId, sections])

  // Keep URL clean when filtering categories
  const clearHash = () => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }
  }

  useEffect(() => {
    if (!slug) {
      setError("No se encontró el menú solicitado.")
      setIsLoading(false)
      return
    }

    // Fetch the public menu JSON by slug
    const controller = new AbortController()
    const loadMenu = async () => {
      try {
        setIsLoading(true)
        setError("")
        const response = await fetch(`${getApiBase()}/menu/${encodeURIComponent(slug)}`, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          const message = await response.text()
          throw new Error(message || "No se pudo cargar el menú.")
        }

        const raw = await response.json()
        const payload = raw?.data ?? raw
        const menu = payload?.menu ?? payload
        const restaurantData = (menu?.restaurant ?? payload?.restaurant ?? menu) as MenuRestaurant
        const categories = (menu?.categories ?? payload?.categories ?? []) as MenuCategory[]
        const items = (menu?.dishes ?? payload?.dishes ?? menu?.items ?? payload?.items ?? []) as MenuItem[]

        const categoryMap = new Map(
          (Array.isArray(categories) ? categories : []).map((cat, index) => [
            String(cat.id ?? `cat-${index}`),
            cat.name || "Sin categoría",
          ])
        )

        let normalizedSections: MenuSection[] = []

        // Prefer category-based structure when available
        if (Array.isArray(categories) && categories.length > 0) {
          normalizedSections = categories.map((category, index) => ({
            id: slugify(category.name || `cat-${index}`),
            name: category.name || "Sin categoría",
            description: category.description || "",
            items: Array.isArray(category.dishes)
              ? category.dishes
              : Array.isArray(category.items)
                ? category.items
                : Array.isArray(category.products)
                  ? category.products
                  : [],
          }))
        } else if (Array.isArray(items) && items.length > 0) {
          // Fallback: group items by category id
          const grouped = new Map<string, MenuItem[]>()
          items.forEach((item) => {
            const key = String(item.category_id ?? item.categoryId ?? "general")
            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key)?.push(item)
          })
          normalizedSections = Array.from(grouped.entries()).map(([key, groupedItems]) => ({
            id: slugify(categoryMap.get(key) || key),
            name: categoryMap.get(key) || "Platos",
            items: groupedItems,
          }))
        }

        setRestaurant(restaurantData || null)
        setSections(normalizedSections)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "No se pudo cargar el menú.")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadMenu()
    return () => controller.abort()
  }, [slug])

  return (
    <div className="min-h-screen bg-[#f6f1ea] text-[#2b2a27]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {menuTitle}
          </h1>
          {restaurant?.description && (
            <p className="text-[#6b645c] mt-2">{restaurant.description}</p>
          )}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {restaurant?.logo && (
              <img
                src={resolveImageUrl(restaurant.logo)}
                alt={`Logo ${restaurant.name || "restaurante"}`}
                className="w-20 h-20 rounded-full bg-white object-cover shadow"
                onError={(event) => applyImageFallback(event.currentTarget)}
              />
            )}
            <div className="text-sm text-[#6b645c] space-y-1">
              {restaurant?.address && (
                <div>
                  <span className="font-medium">Dirección:</span> {restaurant.address}
                </div>
              )}
              {restaurant?.phone && (
                <div>
                  <span className="font-medium">Teléfono:</span> {restaurant.phone}
                </div>
              )}
            </div>
          </div>
        </header>

        {!isLoading && !error && sections.length > 0 && (
          <nav className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveCategoryId("all")
                clearHash()
              }}
              className={`px-4 py-1.5 rounded-full text-sm shadow transition ${
                activeCategoryId === "all"
                  ? "bg-[#6f553e] text-white"
                  : "bg-white text-[#5c5248] hover:bg-[#efe6da]"
              }`}
            >
              Todas
            </button>
            {sections.map((section) => (
              <button
                type="button"
                key={section.id}
                onClick={() => {
                  setActiveCategoryId(section.id)
                  clearHash()
                }}
                className={`px-4 py-1.5 rounded-full text-sm shadow transition ${
                  activeCategoryId === section.id
                    ? "bg-[#6f553e] text-white"
                    : "bg-white text-[#5c5248] hover:bg-[#efe6da]"
                }`}
              >
                {section.name}
              </button>
            ))}
          </nav>
        )}

        {isLoading && (
          <div className="bg-white p-6 rounded-xl shadow text-gray-600">
            Cargando menú...
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        {!isLoading && !error && sections.length === 0 && (
          <div className="bg-white p-6 rounded-xl shadow text-gray-600">
            No hay platos disponibles.
          </div>
        )}

        <div className="space-y-8">
          {visibleSections.map((section) => (
            <section key={section.id} className="bg-white/70 rounded-2xl shadow p-6 border border-[#eadfce]">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#4b3f32]">{section.name}</h2>
                <span className="h-px flex-1 bg-[#e3d6c3]" />
                {section.description && (
                  <p className="text-sm text-[#7a6f63]">{section.description}</p>
                )}
              </div>
              <div className="space-y-4">
                {section.items.map((item, index) => (
                  <div
                    key={String(item.id ?? `${section.id}-${index}`)}
                    className="flex gap-4 items-center bg-white rounded-2xl border border-[#efe3d2] shadow-sm px-4 py-3"
                  >
                    <div className="w-20 h-20 rounded-xl bg-[#f2e9dd] overflow-hidden flex items-center justify-center">
                      {(item.image_url || item.imageUrl) ? (
                        <img
                          src={resolveImageUrl(item.image_url || item.imageUrl || "")}
                          alt={item.name || "Plato"}
                          className="w-full h-full object-cover"
                          onError={(event) => applyImageFallback(event.currentTarget)}
                        />
                      ) : (
                        <img
                          src={DEFAULT_IMAGE}
                          alt="Imagen por defecto"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[#3f352c]">{item.name || "Plato"}</h3>
                            {item.available === false && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#eee2d1] text-[#7a6f63]">
                                No disponible
                              </span>
                            )}
                            {item.featured && (
                              <span className="text-xs px-2 py-0.5 rounded bg-[#fff4d6] text-[#8a5a00]">
                                Plato destacado
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-[#7a6f63]">{item.description}</p>
                          )}
                          {Array.isArray(item.tags) && item.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.slice(0, 4).map((tag: string, tagIndex: number) => (
                                <span
                                  key={`${item.id ?? index}-tag-${tagIndex}`}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#f2e9dd] text-[#6b645c]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.offer_price != null && formatPrice(item.offer_price) ? (
                          <div className="text-right">
                            {formatPrice(item.price) && (
                              <div className="text-sm text-[#8e7e6f] line-through">
                                ${formatPrice(item.price)}
                              </div>
                            )}
                            <div className="font-semibold text-[#2d6a4f]">
                              ${formatPrice(item.offer_price)}
                            </div>
                          </div>
                        ) : (
                          formatPrice(item.price) && (
                            <span className="font-semibold text-[#6f553e]">
                              ${formatPrice(item.price)}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
