import AdminLayout from "../../components/layout/AdminLayout"
import { menusMock } from "../../mocks/menuMock"

export default function AdminMenuListPage() {
  return (
    <AdminLayout>
      <div>

        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Menús</h1>

          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full sm:w-auto">
            Crear Menú
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Estado</th>
                <th className="p-3 hidden sm:table-cell">Fecha creación</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {menusMock.map(menu => (
                <tr key={menu.id} className="border-t">

                  <td className="p-3">{menu.name}</td>

                  <td className="p-3">
                    {menu.active ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                        Activo
                      </span>
                    ) : (
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                        Inactivo
                      </span>
                    )}
                  </td>

                  <td className="p-3 hidden sm:table-cell">{menu.createdAt}</td>

                  <td className="p-3 space-x-2">

                    <button className="text-blue-600 hover:underline">
                      Editar
                    </button>

                    <button className="text-red-600 hover:underline">
                      Eliminar
                    </button>

                  </td>

                </tr>
              ))}
            </tbody>

            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
