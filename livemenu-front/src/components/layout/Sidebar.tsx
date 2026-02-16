import { List, Soup, Store } from "lucide-react"
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
                <Link to="/admin" className="block">
                <h2 className="text-2xl font-bold mb-8">
                    LiveMenu
                </h2>
                </Link>
            )}

            {/* Menu */}
            <nav className="space-y-4">

                {/* <SidebarItem icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} to="/admin" /> */}

                {/* <SidebarItem icon={<Menu />} label="Mi restaurante" collapsed={collapsed} to="/admin/restaurant" /> */}

                <SidebarItem icon={<Store />} label="Mi restaurante" collapsed={collapsed} to="/admin/restaurant" />

                <SidebarItem
                    icon={<Soup />}
                    label="Platos"
                    collapsed={collapsed}
                    to="/admin/platos"
                    state={{ resetPlatesView: Date.now() }}
                />

                <SidebarItem
                    icon={<List />}
                    label="Categorías"
                    collapsed={collapsed}
                    to="/admin/categorias"
                    state={{ resetCategoriesView: Date.now() }}
                />

                {/* <SidebarItem icon={<Package />} label="Productos" collapsed={collapsed} /> */}

            </nav>

        </aside>
    )
}

function SidebarItem({ icon, label, collapsed, to, state }: any) {
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
            <Link to={to} state={state} className={className}>
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
