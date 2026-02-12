import { LayoutDashboard, Menu, List, Package } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

export default function Sidebar() {

    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={`bg-gradient-to-br from-blue-600 to-indigo-900 text-white p-4 transition-all duration-300
            ${collapsed ? "w-20" : "w-64"}`}
        >

            {/* Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="mb-8"
            >
                ☰
            </button>

            {/* Logo */}
            {!collapsed && (
                <h2 className="text-2xl font-bold mb-8">
                    LiveMenu
                </h2>
            )}

            {/* Menu */}
            <nav className="space-y-4">

                <SidebarItem icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} to="/admin" />

                <SidebarItem icon={<Menu />} label="Mi restaurante" collapsed={collapsed} to="/admin/restaurant" />

                <SidebarItem icon={<Menu />} label="Platos" collapsed={collapsed} to="/admin/platos" />

                <SidebarItem icon={<List />} label="Categorías" collapsed={collapsed} />

                <SidebarItem icon={<Package />} label="Productos" collapsed={collapsed} />

            </nav>

        </aside>
    )
}

function SidebarItem({ icon, label, collapsed, to }: any) {
    const content = (
        <>
            {icon}
            {!collapsed && <span>{label}</span>}
        </>
    )

    const className =
        "flex items-center gap-3 px-3 py-2 rounded hover:bg-white/10 cursor-pointer transition"

    if (to) {
        return (
            <Link to={to} className={className}>
                {content}
            </Link>
        )
    }

    return (
        <div className={className}>
            {content}
        </div>
    )
}
