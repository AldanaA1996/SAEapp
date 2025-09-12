import { SidebarProvider, SidebarTrigger } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { ModeToggle } from "@/app/components/Modetoggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppSidebar />         

        <main className="flex flex-1 p-4">{children}</main>
       
      <SidebarTrigger>Menu</SidebarTrigger>
      
    </SidebarProvider>
  );
}