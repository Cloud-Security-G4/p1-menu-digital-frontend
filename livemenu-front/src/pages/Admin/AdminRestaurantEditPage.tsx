import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import AdminLayout from "../../components/layout/AdminLayout"
import {
    createRestaurant,
    getRestaurants,
    updateRestaurant,
    type Restaurant,
    type RestaurantPayload,
} from "../../services/restaurantService"

const emptyProfile: RestaurantPayload = {
    logo: "",
    name: "",
    description: "",
    hours: {},
    phone: "",
    address: "",
}

// Restaurant form
export default function AdminRestaurantEditPage({ mode }: { mode?: "create" | "edit" }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const isCreateMode = useMemo(() => mode === "create" || id === "nuevo", [mode, id])
    const [profile, setProfile] = useState<Restaurant>({
        id: id || "default",
        ...emptyProfile,
    })
    const [saved, setSaved] = useState(false)
    const [logoError, setLogoError] = useState("")
    const [error, setError] = useState("")
    const [nameError, setNameError] = useState("")
    const isFormValid = Boolean(profile.name.trim())
    const days = [
        { key: "monday", label: "Lunes" },
        { key: "tuesday", label: "Martes" },
        { key: "wednesday", label: "Miércoles" },
        { key: "thursday", label: "Jueves" },
        { key: "friday", label: "Viernes" },
        { key: "saturday", label: "Sábado" },
        { key: "sunday", label: "Domingo" },
    ]

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getRestaurants()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                if (!isCreateMode) {
                    const match = items.find((item: Restaurant) => item.id === (id || "default")) || items[0]
                    if (match) {
                        setProfile({
                            ...emptyProfile,
                            ...match,
                            id: match.id,
                            logo: match.logo || "",
                        })
                    }
                } else {
                    setProfile({ id: `rest-${Date.now()}`, ...emptyProfile })
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error cargando restaurante.")
            }
        }
        loadData()
    }, [id, isCreateMode])

    const handleChange = (field: keyof RestaurantPayload | "email", value: string) => {
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
                setProfile((prev) => ({ ...prev, logo: result }))
            }
        }
        reader.readAsDataURL(file)
    }

    const updateHoursForDay = (dayKey: string, ranges: { open: string; close: string }[]) => {
        setProfile((prev) => ({
            ...prev,
            hours: {
                ...prev.hours,
                [dayKey]: ranges,
            },
        }))
    }

    const addRange = (dayKey: string) => {
        const current = profile.hours?.[dayKey] || []
        updateHoursForDay(dayKey, [...current, { open: "08:00", close: "17:00" }])
    }

    const updateRange = (
        dayKey: string,
        index: number,
        field: "open" | "close",
        value: string
    ) => {
        const current = profile.hours?.[dayKey] || []
        const updated = current.map((range, idx) =>
            idx === index ? { ...range, [field]: value } : range
        )
        updateHoursForDay(dayKey, updated)
    }

    const removeRange = (dayKey: string, index: number) => {
        const current = profile.hours?.[dayKey] || []
        const updated = current.filter((_, idx) => idx !== index)
        updateHoursForDay(dayKey, updated)
    }

    const handleSave = async () => {
        setError("")
        if (!profile.name.trim()) {
            setNameError("El nombre es obligatorio.")
            return
        }
        try {
            const payload: RestaurantPayload = {
                name: profile.name,
                description: profile.description,
                phone: profile.phone,
                address: profile.address,
                hours: profile.hours,
                logo: profile.logo || null,
            }
            if (isCreateMode) {
                await createRestaurant(payload)
                navigate("/admin/restaurant", { state: { toast: "Restaurante creado." } })
            } else {
                await updateRestaurant(profile.id, payload)
                setSaved(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error guardando restaurante.")
        }
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                            {isCreateMode ? "Crear restaurante" : "Editar restaurante"}
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
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
                            disabled={!isFormValid}
                        >
                            {isCreateMode ? "Crear restaurante" : "Guardar cambios"}
                        </button>
                    </div>
                </div>

                {!isFormValid && (
                    <p className="text-sm text-red-600">
                        Completa los campos obligatorios marcados con *.
                    </p>
                )}

                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-2 rounded">
                        {error}
                    </div>
                )}

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
                                value={profile.logo || ""}
                                onChange={(e) => {
                                    handleChange("logo", e.target.value)
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
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => {
                                    handleChange("name", e.target.value)
                                    if (nameError) setNameError("")
                                }}
                                maxLength={100}
                                className={`w-full p-2 border rounded ${nameError ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Nombre del restaurante"
                                required
                                aria-required="true"
                            />
                            {nameError && (
                                <p className="mt-1 text-xs text-red-600">
                                    {nameError}
                                </p>
                            )}
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
                            <div className="space-y-3">
                                {days.map((day) => {
                                    const ranges = profile.hours?.[day.key] || []
                                    return (
                                        <div key={day.key} className="border rounded p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">
                                                    {day.label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addRange(day.key)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    Agregar horario
                                                </button>
                                            </div>

                                            {ranges.length === 0 ? (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Cerrado
                                                </p>
                                            ) : (
                                                <div className="mt-2 space-y-2">
                                                    {ranges.map((range, index) => (
                                                        <div
                                                            key={`${day.key}-${index}`}
                                                            className="flex flex-col sm:flex-row gap-2 items-center"
                                                        >
                                                            <input
                                                                type="time"
                                                                value={range.open}
                                                                onChange={(e) =>
                                                                    updateRange(
                                                                        day.key,
                                                                        index,
                                                                        "open",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="p-2 border rounded w-full sm:w-32"
                                                            />
                                                            <span className="text-xs text-gray-500">
                                                                a
                                                            </span>
                                                            <input
                                                                type="time"
                                                                value={range.close}
                                                                onChange={(e) =>
                                                                    updateRange(
                                                                        day.key,
                                                                        index,
                                                                        "close",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="p-2 border rounded w-full sm:w-32"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRange(day.key, index)}
                                                                className="text-xs text-red-600 hover:underline"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
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
                                {profile.logo ? (
                                    <img
                                        src={profile.logo}
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
                                {Object.keys(profile.hours || {}).length === 0 ? "Sin definir" : "Definido"}
                            </p>
                            <p>
                                <span className="font-medium">Teléfono:</span>{" "}
                                {profile.phone || "Sin definir"}
                            </p>
                            {/* <p>
                                <span className="font-medium">Email:</span>{" "}
                                {profile.email || "Sin definir"}
                            </p> */}
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
