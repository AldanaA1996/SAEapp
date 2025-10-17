import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { useLocation } from "react-router-dom";

// Función para obtener el título de la página según la ruta
function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/app": "Iniciar Sesión",
    "/app/signup": "Registro",
    "/app/home": "Pañol",
    "/app/inventario": "Carga de Stock",
    "/app/lista": "Lista de compras",
    "/app/search": "Buscador de Material",
    "/app/movements": "Control",
    "/app/addTool": "Herramientas",
  };

  return routes[pathname] || "LEIA";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
   
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header móvil */}
          <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
            <SidebarTrigger buttonSizeClass="size-9" iconClassName="size-5" aria-label="Abrir/cerrar menú" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          
          {children}
        </SidebarInset>
       
        {/* Floating trigger: fixed, top-right, high z-index; only visible on desktop */}
        <div className="fixed right-3 top-3 z-50 hidden md:block">
          <SidebarTrigger buttonSizeClass="size-10" iconClassName="size-6" aria-label="Abrir/cerrar menú" />
        </div>

    </SidebarProvider>
    
    </>
  );
}