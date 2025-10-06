import { ArrowUpDown, Home, Package, Search, Settings, Drill, DoorOpen, UsersRound, List, LogOut } from "lucide-react"
import { supabase } from "@/app/lib/supabaseClient"
import { useAuthenticationStore } from "@/app/store/authentication"


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar"
import { toast } from "sonner"

// Menu items.
const items = [
  {
    title: "Pañol",
    url: "/app/home",
    icon: Home,
  },
  {
    title: "Carga de Stock",
    url: "/app/inventario",
    icon: Package,
  },
  {
    title: "Lista de compras",
    url: "/app/lista",
    icon: List,
  },
  // {
  //   title: "Herramientas",
  //   url: "/app/addTool",
  //   icon: Drill,
  // },
  // {
  //   title: "Departamentos",
  //   url: "/app/departments",
  //   icon: DoorOpen,
  // },
  {
    title: "Buscador de Material",
    url: "/app/search",
    icon: Search,
  },
  {
    title: "Control",
    url: "/app/movements",
    icon: ArrowUpDown,
  },
  // {
  //   title: "Voluntarios",
  //   url: "#",
  //   icon: UsersRound,
  // },
  {
    title: "Cerrar Sesión",
    url: "#",
    icon: LogOut,
  }
]

export function AppSidebar() {
  const { logout } = useAuthenticationStore()

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    try {
      await supabase.auth.signOut()

      await logout()
    } finally {
      window.location.href = "/app"
      toast.success("Sesión cerrada exitosamente")
    }
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>S.A.E Depo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      onClick={(e) => {
                        // Cerrar sesión
                        // añadir una ventana para confirmar la acción
                        // si el usuario confirma, se ejecuta la función handleLogout
                        
                        if (item.title === "Cerrar Sesión") {
                          handleLogout(e)
                        }
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
export default AppSidebar