import { Link } from "react-router-dom"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"


export default function AdminLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex min-h-screen">

            <Sidebar />

            <div className="flex-1 flex flex-col">

                <Navbar />

                <main className="p-6 bg-gray-100 flex-1">
                    <div className="mb-4">
                        <Link to="/admin/menus">Menús</Link>
                    </div>
                    {children}
                </main>

            </div>

        </div>
    )
}

