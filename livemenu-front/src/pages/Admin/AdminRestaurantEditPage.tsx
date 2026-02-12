import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
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

export default function AdminRestaurantEditPage() {
    const { id } = useParams()
    const [profile, setProfile] = useState<RestaurantProfile>({
        id: id || "default",
        ...emptyProfile,
    })
    const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([])
    const [saved, setSaved] = useState(false)
    const [logoError, setLogoError] = useState("")

    useEffect(() => {
        const items = loadRestaurants()
        setRestaurants(items)
        const match = items.find((item) => item.id === (id || "default"))
        if (match) {
            setProfile({ ...emptyProfile, ...match, id: match.id })
        }
    }, [id])

    const handleChange = (field: keyof RestaurantProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }))
        if (saved) setSaved(false)
    }

    const handleLogoFile = (file: File | null) => {
        if (!file) return
        const maxSizeBytes = 5 * 1024 * 1024
        if (file.size > maxSizeBytes) {
            setLogoError("La imagen no debe superar 5MB.")
            return
        }
        if (!file.type.startsWith("image/")) {
            setLogoError("El archivo debe ser una imagen.")
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : ""
            if (result) {
                setLogoError("")
                setProfile((prev) => ({ ...prev, logoUrl: result }))
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSave = () => {
        const updated = restaurants.some((item) => item.id === profile.id)
            ? restaurants.map((item) => (item.id === profile.id ? profile : item))
            : [...restaurants, profile]
        localStorage.setItem(restaurantsKey, JSON.stringify(updated))
        setRestaurants(updated)
        setSaved(true)
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                            Editar restaurante
                        </h2>
                        <p className="text-sm text-gray-600">
                            Actualiza la información visible del restaurante.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Link
                            to="/admin/restaurant"
                            className="px-4 py-2 rounded border text-center"
                        >
                            Volver
                        </Link>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </div>

                {saved && (
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded">
                        Cambios guardados.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Logo (URL o archivo)
                            </label>
                            <input
                                type="text"
                                value={profile.logoUrl}
                                onChange={(e) => {
                                    handleChange("logoUrl", e.target.value)
                                    if (logoError) setLogoError("")
                                }}
                                className={`w-full p-2 border rounded ${logoError ? "border-red-500" : "border-gray-300"}`}
                                placeholder="https://..."
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                                className="mt-2 w-full text-sm"
                            />
                            {logoError && (
                                <p className="mt-1 text-sm text-red-600">
                                    {logoError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                maxLength={100}
                                className="w-full p-2 border rounded"
                                placeholder="Nombre del restaurante"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {profile.name.length}/100
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={profile.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                maxLength={500}
                                className="w-full p-2 border rounded min-h-[96px]"
                                placeholder="Breve descripción"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {profile.description.length}/500
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Horarios
                            </label>
                            <input
                                type="text"
                                value={profile.hours}
                                onChange={(e) => handleChange("hours", e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Lun-Dom 09:00 - 22:00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Teléfono
                            </label>
                            <input
                                type="text"
                                value={profile.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="+51 999 999 999"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="correo@restaurante.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Dirección
                            </label>
                            <input
                                type="text"
                                value={profile.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Dirección del local"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-lg font-semibold mb-4">
                            Vista previa
                        </h3>

                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                {profile.logoUrl ? (
                                    <img
                                        src={profile.logoUrl}
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
                                    {profile.name || "Nombre del restaurante"}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    {profile.description || "Descripción del restaurante."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 text-sm space-y-2">
                            <p>
                                <span className="font-medium">Horarios:</span>{" "}
                                {profile.hours || "Sin definir"}
                            </p>
                            <p>
                                <span className="font-medium">Teléfono:</span>{" "}
                                {profile.phone || "Sin definir"}
                            </p>
                            <p>
                                <span className="font-medium">Email:</span>{" "}
                                {profile.email || "Sin definir"}
                            </p>
                            <p>
                                <span className="font-medium">Dirección:</span>{" "}
                                {profile.address || "Sin definir"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
