import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage"
import AdminMenuListPage from "./pages/Admin/AdminMenuListPage"
import AdminRestaurantPage from "./pages/Admin/AdminRestaurantPage"
import AdminRestaurantEditPage from "./pages/Admin/AdminRestaurantEditPage"
import AdminCategoryPage from "./pages/Admin/AdminCategoryPage"
import AdminQrPage from "./pages/Admin/AdminQrPage"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = localStorage.getItem("authToken")

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<RequireAuth><AdminDashboardPage /></RequireAuth>} />
        <Route path="/admin/restaurant" element={<RequireAuth><AdminRestaurantPage /></RequireAuth>} />
        <Route path="/admin/restaurant/nuevo" element={<RequireAuth><AdminRestaurantEditPage mode="create" /></RequireAuth>} />
        <Route path="/admin/restaurant/:id/editar" element={<RequireAuth><AdminRestaurantEditPage mode="edit" /></RequireAuth>} />
        <Route path="/admin/platos" element={<RequireAuth><AdminMenuListPage /></RequireAuth>} />
        <Route path="/admin/categorias" element={<RequireAuth><AdminCategoryPage /></RequireAuth>} />
        <Route path="/admin/qr" element={<RequireAuth><AdminQrPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


