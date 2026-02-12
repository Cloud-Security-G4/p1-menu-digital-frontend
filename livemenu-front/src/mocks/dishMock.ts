export type DishMock = {
    id: string
    name: string
    description: string
    price: number
    categoryId: string
    available: boolean
    imageUrl: string
    isDeleted?: boolean
}

export const dishMock: DishMock[] = [
    {
        id: "d-001",
        name: "Lomo Saltado",
        description: "Carne salteada con vegetales y papas fritas.",
        price: 32.5,
        categoryId: "cat-01",
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    },
    {
        id: "d-002",
        name: "Ceviche Clásico",
        description: "Pescado fresco, limón y ají con guarnición.",
        price: 28,
        categoryId: "cat-02",
        available: true,
        imageUrl: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&q=80",
    },
    {
        id: "d-003",
        name: "Tiradito",
        description: "Láminas de pescado con salsa de ají amarillo.",
        price: 30,
        categoryId: "cat-02",
        available: false,
        imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&q=80",
    },
]
