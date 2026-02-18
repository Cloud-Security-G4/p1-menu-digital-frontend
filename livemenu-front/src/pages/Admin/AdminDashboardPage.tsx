import { useEffect, useState } from "react"
import AdminLayout from "../../components/layout/AdminLayout"
import { getRestaurants } from "../../services/restaurantService"
import { getCategories } from "../../services/categoryService"
import { getDishes } from "../../services/dishService"

// Admin landing
export default function AdminDashboardPage() {
    const [restaurantsCount, setRestaurantsCount] = useState(0)
    const [categoriesCount, setCategoriesCount] = useState(0)
    const [availableDishesCount, setAvailableDishesCount] = useState(0)

    useEffect(() => {
        const loadRestaurants = async () => {
            try {
                const data = await getRestaurants()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                setRestaurantsCount(items.length)
            } catch {
                setRestaurantsCount(0)
            }
        }
        loadRestaurants()
    }, [])

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getCategories()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                setCategoriesCount(items.length)
            } catch {
                setCategoriesCount(0)
            }
        }
        loadCategories()
    }, [])

    useEffect(() => {
        const loadDishes = async () => {
            try {
                const data = await getDishes()
                const items = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : data?.id
                            ? [data]
                            : []
                const available = items.filter((item: { available?: boolean }) => item.available).length
                setAvailableDishesCount(available)
            } catch {
                setAvailableDishesCount(0)
            }
        }
        loadDishes()
    }, [])

    return (
        <AdminLayout>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Dashboard
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <Card title="Mis Restaurantes" value={restaurantsCount} />
                <Card title="Paltos disponibles" value={availableDishesCount} />
                <Card title="Categorías" value={categoriesCount} />
            </div>
        </AdminLayout>
    )
}

function Card({ title, value }: any) {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
            <p className="text-gray-500 text-sm sm:text-base">{title}</p>
            <h3 className="text-2xl sm:text-3xl font-bold">{value}</h3>
        </div>
    )
}
