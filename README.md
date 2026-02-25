# LiveMenu Frontend

Frontend del proyecto **LiveMenu**, desarrollado con **React + Vite + TailwindCSS**.  
Permite administrar y visualizar el menú digital del restaurante y se conecta al backend en Laravel.

## Requisitos previos

- **Node.js 20 o superior**
  - Descargar desde: https://nodejs.org/
  - Recomendado: **20.19.0**
- **Backend** ejecutándose (por defecto en `http://127.0.0.1:8000`)

Verificar instalación:

```
node -v
npm -v
```

## Setup

1. Instalar dependencias (desde `livemenu-front/`):

```
npm install
```

2. Configurar variables de entorno (opcional):

Crear un archivo `.env` en `livemenu-front/`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

3. En caso de que no se instale lucide-react acutomáticamente ejecutar:

```
npm install lucide-react
```

## Desarrollo local

```
npm run dev
```

Abrir en el navegador:

```
http://localhost:5173
```

## Scripts útiles

```
npm run dev      # desarrollo
npm run build    # build de producción
npm run preview  # previsualizar build
npm run lint     # lint
```

