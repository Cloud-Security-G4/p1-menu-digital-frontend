import { useMemo, useRef, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"

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
    const [domain, setDomain] = useState(() => {
        const host = window.location.host || "example.com"
        return host
    })
    const [slug, setSlug] = useState("")
    const [includeLogo, setIncludeLogo] = useState(false)
    const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
    const [logoError, setLogoError] = useState("")

    const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const exportSvgRef = useRef<SVGSVGElement | null>(null)
    const previewSize = 320

    const qrValue = useMemo(() => {
        const normalizedDomain = domain
            .trim()
            .replace(/^https?:\/\//i, "")
            .replace(/\/+$/, "")
            || "example.com"
        const safeSlug = slug.trim() || "mi-restaurante"
        return `https://${normalizedDomain}/m/${encodeURIComponent(safeSlug)}`
    }, [domain, slug])

    const handleLogoUpload = (file: File | null) => {
        if (!file) return
        setLogoError("")
        if (file.size > 5 * 1024 * 1024) {
            setLogoError("El logo no puede superar 5MB.")
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            setLogoDataUrl(typeof reader.result === "string" ? reader.result : null)
            setIncludeLogo(true)
        }
        reader.readAsDataURL(file)
    }

    const handleDownload = () => {
        if (format === "png") {
            const canvas = exportCanvasRef.current
            if (!canvas) return
            const dataUrl = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.href = dataUrl
            link.download = `qr-${sizeKey.toLowerCase()}.png`
            link.click()
            return
        }

        const svg = exportSvgRef.current
        if (!svg) return
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svg)
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `qr-${sizeKey.toLowerCase()}.svg`
        link.click()
        URL.revokeObjectURL(link.href)
    }

    const previewLogoSettings = includeLogo && logoDataUrl
        ? {
            src: logoDataUrl,
            height: Math.round(previewSize * 0.2),
            width: Math.round(previewSize * 0.2),
            excavate: true,
        }
        : undefined

    const exportLogoSettings = includeLogo && logoDataUrl
        ? {
            src: logoDataUrl,
            height: Math.round(SIZE_OPTIONS[sizeKey] * 0.2),
            width: Math.round(SIZE_OPTIONS[sizeKey] * 0.2),
            excavate: true,
        }
        : undefined

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
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                Dominio
                                <input
                                    value={domain}
                                    onChange={(event) => setDomain(event.target.value)}
                                    className="border rounded px-3 py-2 text-gray-900"
                                    placeholder="tudominio.com"
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                Slug del menú
                                <input
                                    value={slug}
                                    onChange={(event) => setSlug(event.target.value)}
                                    className="border rounded px-3 py-2 text-gray-900"
                                    placeholder="mi-restaurante"
                                />
                            </label>
                        </div>

                        <div className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                            URL codificada
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeLogo}
                                    onChange={(event) => setIncludeLogo(event.target.checked)}
                                />
                                Incluir logo central (opcional)
                            </label>
                            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                                Logo (máx. 5MB)
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => handleLogoUpload(event.target.files?.[0] || null)}
                                    className="text-gray-700"
                                />
                                {logoError && (
                                    <span className="text-xs text-red-600">{logoError}</span>
                                )}
                            </label>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto"
                        >
                            Descargar QR
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-600">Preview en tiempo real</p>
                        <div className="flex items-center justify-center rounded-lg bg-gray-50 p-4 w-full">
                            {format === "png" ? (
                                <QRCodeCanvas
                                    value={qrValue}
                                    size={previewSize}
                                    level="H"
                                    includeMargin
                                    imageSettings={previewLogoSettings}
                                />
                            ) : (
                                <QRCodeSVG
                                    value={qrValue}
                                    size={previewSize}
                                    level="H"
                                    includeMargin
                                    imageSettings={previewLogoSettings}
                                />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Tamaños disponibles: S 200px, M 400px, L 800px, XL 1200px.
                        </p>
                    </div>
                </div>
                <div className="absolute -left-[9999px] -top-[9999px]">
                    <QRCodeCanvas
                        value={qrValue}
                        size={SIZE_OPTIONS[sizeKey]}
                        level="H"
                        includeMargin
                        ref={exportCanvasRef}
                        imageSettings={exportLogoSettings}
                    />
                    <QRCodeSVG
                        value={qrValue}
                        size={SIZE_OPTIONS[sizeKey]}
                        level="H"
                        includeMargin
                        ref={exportSvgRef}
                        imageSettings={exportLogoSettings}
                    />
                </div>
            </div>
        </AdminLayout>
    )
}
