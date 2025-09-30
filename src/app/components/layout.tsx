import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
   
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
       
        {/* Floating trigger: fixed, top-left, high z-index; does not shift layout */}
        <div className="fixed right-3 top-3 z-50">
          <SidebarTrigger buttonSizeClass="size-10" iconClassName="size-6" aria-label="Abrir/cerrar menú" />
        </div>

    </SidebarProvider>
    
    </>
  );
}