import { ArrowUpDown, Home, Package, Search, Settings, Drill, DoorOpen, UsersRound } from "lucide-react"


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

// Menu items.
const items = [
  {
    title: "Home",
    url: "/app/home",
    icon: Home,
  },
  {
    title: "Inventario",
    url: "/app/inventario",
    icon: Package,
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
    title: "Buscar",
    url: "/app/search",
    icon: Search,
  },
  {
    title: "Movimientos",
    url: "/app/movements",
    icon: ArrowUpDown,
  },
  // {
  //   title: "Voluntarios",
  //   url: "#",
  //   icon: UsersRound,
  // },
  
]

export function AppSidebar() {
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
                    <a href={item.url}>
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