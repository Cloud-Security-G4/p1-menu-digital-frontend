export type RestaurantMock = {
    id: string
    logoUrl: string
    name: string
    description: string
    hours: string
    phone: string
    email: string
    address: string
}

export const restaurantsMock: RestaurantMock[] = [
    {
        id: "r-001",
        logoUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80",
        name: "La Terraza",
        description: "Cocina peruana contemporánea con insumos locales.",
        hours: "Lun-Dom 09:00 - 22:00",
        phone: "+51 987 654 321",
        email: "contacto@laterraza.pe",
        address: "Av. Principal 123, Lima",
    },
    {
        id: "r-002",
        logoUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=300&q=80",
        name: "Bistró 27",
        description: "Bistró urbano con platos de autor y coctelería.",
        hours: "Mar-Dom 12:00 - 23:30",
        phone: "+51 999 222 333",
        email: "hola@bistro27.pe",
        address: "Calle Central 456, Arequipa",
    },
]
