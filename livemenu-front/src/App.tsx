import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage"
import AdminMenuListPage from "./pages/Admin/AdminMenuListPage"
import AdminRestaurantPage from "./pages/Admin/AdminRestaurantPage"
import AdminRestaurantEditPage from "./pages/Admin/AdminRestaurantEditPage"
import AdminCategoryPage from "./pages/Admin/AdminCategoryPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/restaurant" element={<AdminRestaurantPage />} />
        <Route path="/admin/restaurant/:id/editar" element={<AdminRestaurantEditPage />} />
        <Route path="/admin/platos" element={<AdminMenuListPage />} />
        <Route path="/admin/categorias" element={<AdminCategoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


