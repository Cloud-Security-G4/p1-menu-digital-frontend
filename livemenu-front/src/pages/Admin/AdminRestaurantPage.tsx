import { Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import AdminLayout from "../../components/layout/AdminLayout"
import { restaurantsMock } from "../../mocks/restaurantMock"

type RestaurantProfile = {
    id: string
    logoUrl: string
    name: string
    description: string
    hours: string
    phone: string
    email: string
    address: string
}

const emptyProfile: Omit<RestaurantProfile, "id"> = {
    logoUrl: "",
    name: "",
    description: "",
    hours: "",
    phone: "",
    email: "",
    address: "",
}

const restaurantsKey = "restaurants"
const legacyKey = "restaurantProfile"

const loadRestaurants = (): RestaurantProfile[] => {
    const stored = localStorage.getItem(restaurantsKey)
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as RestaurantProfile[]
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    const legacy = localStorage.getItem(legacyKey)
    if (legacy) {
        try {
            const parsedLegacy = JSON.parse(legacy) as Omit<RestaurantProfile, "id">
            const migrated = [{ id: "default", ...emptyProfile, ...parsedLegacy }]
            localStorage.setItem(restaurantsKey, JSON.stringify(migrated))
            return migrated
        } catch {
            return []
        }
    }

    return restaurantsMock
}

export default function AdminRestaurantPage() {
    const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([])

    useEffect(() => {
        setRestaurants(loadRestaurants())
    }, [])

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold">
                        Mis restaurantes
                    </h2>
                    <Link
                        to="/admin/restaurant/nuevo/editar"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto text-center"
                    >
                        Agregar restaurante
                    </Link>
                </div>

                {restaurants.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl shadow text-gray-600">
                        No hay restaurantes registrados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {restaurants.map((restaurant) => (
                            <div
                                key={restaurant.id}
                                className="bg-white p-6 rounded-xl shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {restaurant.logoUrl ? (
                                                <img
                                                    src={restaurant.logoUrl}
                                                    alt="Logo del restaurante"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-sm">
                                                    Logo
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold">
                                                {restaurant.name || "Nombre del restaurante"}
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                {restaurant.description || "Descripción del restaurante."}
                                            </p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/admin/restaurant/${restaurant.id}/editar`}
                                        className="text-blue-600 hover:text-blue-700"
                                        aria-label="Editar restaurante"
                                    >
                                        <Pencil size={18} />
                                    </Link>
                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="font-medium">Horarios:</span>{" "}
                                        {restaurant.hours || "Sin definir"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Teléfono:</span>{" "}
                                        {restaurant.phone || "Sin definir"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email:</span>{" "}
                                        {restaurant.email || "Sin definir"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Dirección:</span>{" "}
                                        {restaurant.address || "Sin definir"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
