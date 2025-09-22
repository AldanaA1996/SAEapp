# SAEapp — Gestión de Inventario (Astro + React + Supabase)

Aplicación web para gestionar inventario con altas, bajas y modificaciones de materiales, búsquedas rápidas, alertas por stock bajo, registro de movimientos y exportación completa a CSV. Construida con Astro + React en el frontend y Supabase como backend de datos.

## ✨ Características

- **Inventario**: listado de materiales con cantidad, unidad, descripción, fabricante, código de barras y mínimo.
- **Búsqueda y filtros**: búsqueda por texto y opción de ver solo items con stock bajo.
- **Movimientos**: registro de ingresos y egresos, con historial en la tabla `activity`.
- **Edición**: creación, actualización y eliminación de materiales en `inventory`.
- **Alertas**: notificaciones cuando un material queda por debajo del mínimo definido.
- **Exportación CSV**: descarga de todo el inventario en CSV con paginación mediante Supabase `.range()`.

## 📦 Stack

- Astro + React (TypeScript)
- Supabase (Base de datos y cliente JS)
- Shadcn/UI + Tailwind (componentes UI)

## 🗂️ Estructura del proyecto (resumen)

```text
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── page/
│   │   │   │   ├── Home.tsx          # Ingresos/Egresos
│   │   │   │   ├── Search.tsx        # Búsqueda y gestión de inventario
│   │   │   ├── editMaterial.tsx
│   │   │   ├── csvDownload.tsx       # Utilidad de descarga CSV (paginada)
│   │   ├── lib/
│   │   │   └── supabaseClient.ts     # Cliente Supabase
│   │   └── store/
│   └── pages/
├── public/
├── utils/
├── package.json
└── README.md
```

## 🔧 Requisitos previos

- Node.js 18+
- Cuenta de Supabase y una base de datos con tablas `inventory` y `activity` (o las tablas que utilices).

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz con:

```bash
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

Estas variables son leídas en `src/app/lib/supabaseClient.ts`.

## 🚀 Scripts

Todos los comandos se corren en la raíz del proyecto:

- `npm install`
  - Instala dependencias.
- `npm run dev`
  - Inicia el servidor de desarrollo en `http://localhost:4321`.
- `npm run build`
  - Genera la build de producción en `./dist/`.
- `npm run preview`
  - Previsualiza la build localmente.

## 📤 Exportar Inventario a CSV

La exportación se realiza desde `Search.tsx` mediante el botón “Descargar CSV”, que llama a `downloadInventoryCsv()` definido en `src/app/components/csvDownload.tsx`.

Detalles de la exportación:

- Se pagina con Supabase usando `select('*', { count: 'exact', head: true })` y `.range(from, to)` para traer todos los registros.
- Se ordena por `id` ascendente para paginar de forma estable.
- Se genera un CSV con un conjunto base de columnas y se agregan automáticamente columnas extra detectadas en la respuesta.

## 🌐 Exponer localmente con ngrok (opcional)

1. Asegúrate de tener el dev server corriendo en `http://localhost:4321`.
2. Ejecuta:

```bash
ngrok http 4321
# o explícito
ngrok http http://localhost:4321
```

Usa la URL pública que te brinde ngrok (https://xxxxx.ngrok-free.app).

## 📄 Licencia

Proyecto interno. Ajusta esta sección si corresponde otra licencia.
