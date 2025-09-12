import Layout from "@/app/components/layout";

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center w-full p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Bienvenido a S.A.E Depo</h1>
         
        <div className="max-w-4xl mx-auto text-lg">
          <p className="mb-4">
            SAE Depo es tu sistema de gestión de inventario. Aquí puedes llevar un control de los materiales y herramientas en los diferentes departamentos de tu organización.
          </p>
          <h2 className="text-2xl font-semibold mt-6 mb-4">¿Cómo empezar?</h2>
          <ol className="list-decimal list-inside space-y-4">
            <li>
              <strong>Navega a un departamento:</strong>
              <p className="text-base ml-4">
                Utiliza la barra lateral para seleccionar y ver los departamentos. Cada departamento tiene su propio inventario de materiales y herramientas.
              </p>
            </li>
            <li>
              <strong>Gestiona tu inventario:</strong>
              <p className="text-base ml-4">
                Dentro de cada departamento, verás dos pestañas: "Materiales" y "Herramientas". Aquí puedes ver la lista de artículos disponibles.
              </p>
            </li>
            <li>
              <strong>Añade nuevos artículos:</strong>
              <p className="text-base ml-4">
                Busca en la barra lateral "Inventario" o "Herramientas" para registrar nuevos artículos en el inventario. Rellena el formulario y ¡listo!
              </p>
            </li>
            <li>
              <strong>Edita o elimina artículos:</strong>
              <p className="text-base ml-4">
                Junto a cada artículo, encontrarás botones para "Editar" o "Eliminar". Esto te permite mantener tu inventario siempre actualizado.
              </p>
            </li>
          </ol>
          <p className="mt-6">
            Explora las diferentes secciones y familiarízate con las herramientas que SAE Depo te ofrece para hacer tu trabajo más fácil y organizado.
          </p>
          
        </div>
      </div>
    </Layout>
  );
}
