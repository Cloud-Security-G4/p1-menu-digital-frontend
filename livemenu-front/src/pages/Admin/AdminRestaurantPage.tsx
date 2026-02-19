import { Pencil, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import AdminLayout from "../../components/layout/AdminLayout"
import { deleteRestaurant, getRestaurants, type Restaurant } from "../../services/restaurantService"

const formatHours = (hours: Restaurant["hours"]) => {
    const entries = Object.entries(hours || {})
    if (entries.length === 0) return "Sin definir"

    return entries
        .map(([day, ranges]) => {
            const dayLabelMap: Record<string, string> = {
                monday: "Lunes",
                tuesday: "Martes",
                wednesday: "Miércoles",
                thursday: "Jueves",
                friday: "Viernes",
                saturday: "Sábado",
                sunday: "Domingo",
            }
            const label = dayLabelMap[day] || day
            if (!ranges || ranges.length === 0) return `${label}: cerrado`
            const slots = ranges.map((range) => `${range.open}-${range.close}`).join(", ")
            return `${label}: ${slots}`
        })
        .join(" | ")
}

// Restaurants admin
export default function AdminRestaurantPage() {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [error, setError] = useState("")
    const hasLoaded = useRef(false)
    const [pendingDelete, setPendingDelete] = useState<Restaurant | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState("")
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        const stateToast = (location.state as { toast?: string } | null)?.toast
        if (stateToast) {
            setToast(stateToast)
            navigate(location.pathname, { replace: true, state: null })
        }
    }, [location.pathname, location.state, navigate])

    useEffect(() => {
        if (!toast) return
        const timer = window.setTimeout(() => setToast(""), 3000)
        return () => window.clearTimeout(timer)
    }, [toast])

    useEffect(() => {
        if (hasLoaded.current) return
        hasLoaded.current = true
        const loadData = async () => {
            try {
                setIsLoading(true)
                const data = await getRestaurants()
                const item = Array.isArray(data)
                    ? data[0]
                    : Array.isArray(data?.data)
                        ? data.data[0]
                        : data?.id
                            ? data
                            : null
                setRestaurant(item || null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error cargando restaurantes.")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const handleDelete = async () => {
        if (!pendingDelete) return
        setIsDeleting(true)
        try {
            await deleteRestaurant(pendingDelete.id)
            setRestaurant(null)
            setPendingDelete(null)
            setToast("Restaurante eliminado.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error eliminando restaurante.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold">
                        Mi restaurante
                    </h2>
                    {/* <Link
                        to="/admin/restaurant/nuevo"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto text-center"
                    >
                        Agregar restaurante
                    </Link> */}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

                {toast && (
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded">
                        {toast}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-600">
                            Estamos cargando tus restaurantes...
                        </div>
                        <div className="h-1 w-full bg-blue-100 rounded overflow-hidden">
                            <div className="h-full w-full bg-blue-600 animate-pulse" />
                        </div>
                    </div>
                )}

                {!restaurant && !error && !isLoading ? (
                    <div className="bg-white p-6 rounded-xl shadow text-gray-600">
                        No hay restaurante registrado.
                    </div>
                ) : (
                    restaurant && (
                        <div className="bg-white p-6 rounded-xl shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {restaurant.logo ? (
                                            <img
                                                src={restaurant.logo}
                                                alt="Logo del restaurante"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-sm">
                                                Logo
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xl font-bold truncate">
                                            {restaurant.name || "Nombre del restaurante"}
                                        </h4>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {restaurant.description || "Descripción del restaurante."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <Link
                                        to={`/admin/restaurant/${restaurant.id}/editar`}
                                        className="text-blue-600 hover:text-blue-700"
                                        aria-label="Editar restaurante"
                                    >
                                        <Pencil size={18} />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(restaurant)}
                                        className="text-red-600 hover:text-red-700"
                                        aria-label="Eliminar restaurante"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="font-medium">Horarios:</span>{" "}
                                    {formatHours(restaurant.hours)}
                                </div>
                                <div>
                                    <span className="font-medium">Teléfono:</span>{" "}
                                    {restaurant.phone || "Sin definir"}
                                </div>
                                <div>
                                    <span className="font-medium">Dirección:</span>{" "}
                                    {restaurant.address || "Sin definir"}
                                </div>
                                <div>
                                    <span className="font-medium">URL pública:</span>{" "}
                                    {restaurant.slug || "Sin definir"}
                                </div>
                            </div>
                        </div>
                    )
                )}

                {pendingDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                            <h3 className="text-lg font-semibold mb-2">
                                ¿Eliminar restaurante?
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Esta acción no se puede deshacer. Se eliminará
                                <span className="font-medium"> {pendingDelete.name || "el restaurante"}</span>.
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
