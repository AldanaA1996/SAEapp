import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { ModeToggle } from "@/app/components/Modetoggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppSidebar />         

        <SidebarInset>{children}</SidebarInset>
       
      <SidebarTrigger>Menu</SidebarTrigger>
      
    </SidebarProvider>
  );
}