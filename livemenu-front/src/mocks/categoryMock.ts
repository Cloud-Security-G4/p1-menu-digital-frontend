export type CategoryMock = {
    id: string
    name: string
    description: string
    position: number
}

export const categoryMock: CategoryMock[] = [
    {
        id: "cat-01",
        name: "Clásicos",
        description: "Platos tradicionales del restaurante.",
        position: 1,
    },
    {
        id: "cat-02",
        name: "Marinos",
        description: "Especialidades con pescados y mariscos.",
        position: 2,
    },
    {
        id: "cat-03",
        name: "Bebidas",
        description: "Refrescos, jugos y bebidas calientes.",
        position: 3,
    },
]
