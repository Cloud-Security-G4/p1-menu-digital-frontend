import { useEffect, useMemo, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import { getRestaurants } from "../../services/restaurantService"
import { getApiBase } from "../../services/api"

const SIZE_OPTIONS = {
    S: 200,
    M: 400,
    L: 800,
    XL: 1200,
} as const

type SizeKey = keyof typeof SIZE_OPTIONS
type FormatKey = "png" | "svg"

export default function AdminQrPage() {
    const [sizeKey, setSizeKey] = useState<SizeKey>("M")
    const [format, setFormat] = useState<FormatKey>("png")
    const [domain] = useState(() => {
        const host = window.location.host || "example.com"
        return host
    })
    const [slug, setSlug] = useState("")
    const [downloadError, setDownloadError] = useState("")
    const [isDownloading, setIsDownloading] = useState(false)
    const [isLoadingSlug, setIsLoadingSlug] = useState(true)
    const [previewSvg, setPreviewSvg] = useState<string | null>(null)
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState("")
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const qrValue = useMemo(() => {
        const normalizedDomain = domain
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/\/+$/, "")
            || "example.com"
        const safeSlug = slug.trim() || "mi-restaurante"
        return `http://${normalizedDomain}/m/${encodeURIComponent(safeSlug)}`
    }, [domain, slug])


    useEffect(() => {
        const loadSlug = async () => {
            try {
                const data = await getRestaurants()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                const restaurant = items[0]
                if (restaurant?.slug) {
                    setSlug(String(restaurant.slug))
                }
            } catch {
                // ignore slug loading errors for now
            } finally {
                setIsLoadingSlug(false)
            }
        }
        loadSlug()
    }, [])

    const buildQrUrl = () => {
        const params = new URLSearchParams()
        params.set("format", format)
        params.set("size", sizeKey.toLowerCase())

        const base = getApiBase()
        const query = params.toString()
        return query ? `${base}/admin/qr?${query}` : `${base}/admin/qr`
    }

    const handleDownload = async () => {
        const safeSlug = slug.trim()
        if (!safeSlug) return

        setDownloadError("")
        setIsDownloading(true)

        try {
            const url = buildQrUrl()
            const token = localStorage.getItem("authToken")

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: format === "svg" ? "image/svg+xml" : "image/png",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })

            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || "No se pudo descargar el QR.")
            }

            const contentType = response.headers.get("content-type") || ""
            let extension = format
            if (contentType.includes("svg")) {
                extension = "svg"
            } else if (contentType.includes("png")) {
                extension = "png"
            }

            const blob = await response.blob()
            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = `qr-${sizeKey.toLowerCase()}.${extension}`
            link.click()
            URL.revokeObjectURL(link.href)
        } catch (err) {
            setDownloadError(err instanceof Error ? err.message : "No se pudo descargar el QR.")
        } finally {
            setIsDownloading(false)
        }
    }

    useEffect(() => {
        let isActive = true
        const safeSlug = slug.trim()
        if (!safeSlug) {
            setPreviewSvg(null)
            setPreviewImageUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
            return
        }

        const loadPreview = async () => {
            setIsLoadingPreview(true)
            setPreviewError("")
            try {
                const url = buildQrUrl()
                const token = localStorage.getItem("authToken")
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        Accept: format === "svg" ? "image/svg+xml" : "image/png",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                })

                if (!response.ok) {
                    const message = await response.text()
                    throw new Error(message || "No se pudo cargar el QR.")
                }

                const contentType = response.headers.get("content-type") || ""
                if (contentType.includes("svg")) {
                    const svgText = await response.text()
                    if (!isActive) return
                    setPreviewSvg(svgText)
                    setPreviewImageUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev)
                        return null
                    })
                    return
                }

                const blob = await response.blob()
                const objectUrl = URL.createObjectURL(blob)
                if (!isActive) {
                    URL.revokeObjectURL(objectUrl)
                    return
                }
                setPreviewSvg(null)
                setPreviewImageUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return objectUrl
                })
            } catch (err) {
                if (!isActive) return
                setPreviewError(err instanceof Error ? err.message : "No se pudo cargar el QR.")
            } finally {
                if (isActive) setIsLoadingPreview(false)
            }
        }

        loadPreview()
        return () => {
            isActive = false
        }
    }, [format, sizeKey, slug])

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Mi código QR</h2>
                    <p className="text-gray-600">
                        Genera y descarga un código QR personalizado para tu menú.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-5">

                        <div className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                            URL
                            <div className="rounded bg-gray-50 px-3 py-2 text-gray-800 break-all">
                                {qrValue}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                Tamaño de salida
                                <select
                                    value={sizeKey}
                                    onChange={(event) => setSizeKey(event.target.value as SizeKey)}
                                    className="border rounded px-3 py-2 text-gray-900"
                                >
                                    {Object.entries(SIZE_OPTIONS).map(([key, size]) => (
                                        <option key={key} value={key}>
                                            {key} ({size}x{size}px)
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                Formato
                                <select
                                    value={format}
                                    onChange={(event) => setFormat(event.target.value as FormatKey)}
                                    className="border rounded px-3 py-2 text-gray-900"
                                >
                                    <option value="png">PNG</option>
                                    <option value="svg">SVG</option>
                                </select>
      
                            </label>
                        </div>

                        {downloadError && (
                            <p className="text-sm text-red-600">{downloadError}</p>
                        )}
                        <button
                            onClick={handleDownload}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto disabled:opacity-60"
                            disabled={isDownloading || isLoadingSlug || !slug.trim()}
                        >
                            {isDownloading ? "Descargando..." : "Descargar QR"}
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-600">Preview en tiempo real</p>
                        <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4 w-full">
                            {isLoadingPreview ? (
                                <div className="flex flex-col items-center gap-3 text-gray-500">
                                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                                    <span className="text-xs">Generando QR...</span>
                                </div>
                            ) : previewError ? (
                                <p className="text-sm text-red-600">{previewError}</p>
                            ) : previewSvg ? (
                                <div
                                    className="w-full max-w-[360px] sm:max-w-[420px] [&_svg]:w-full [&_svg]:h-auto"
                                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                                />
                            ) : previewImageUrl ? (
                                <img
                                    src={previewImageUrl}
                                    alt="QR generado"
                                    className="w-full max-w-[360px] sm:max-w-[420px] h-auto"
                                />
                            ) : (
                                <span className="text-xs text-gray-400">Sin preview</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Tamaños disponibles: S 200px, M 400px, L 800px, XL 1200px.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
