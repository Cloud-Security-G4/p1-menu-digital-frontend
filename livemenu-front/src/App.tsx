import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage"
import AdminMenuListPage from "./pages/Admin/AdminMenuListPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/platos" element={<AdminMenuListPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


