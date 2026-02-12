import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Navbar() {
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        localStorage.removeItem("authToken")
        localStorage.removeItem("authUser")
        navigate("/")
    }

    return (
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">

            <h1 className="font-semibold text-lg">
                Panel Administrador
            </h1>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-sm font-medium"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen ? "true" : "false"}
                >
                    <span>👤 Admin</span>
                    <span className="text-xs">▾</span>
                </button>

                {isMenuOpen && (
                    <div
                        role="menu"
                        className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow"
                    >
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            role="menuitem"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>

        </header>
    )
}

  