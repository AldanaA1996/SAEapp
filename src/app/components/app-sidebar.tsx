import { HandHelping, Home, Inbox, Search, Settings, Drill, DoorOpen, UsersRound } from "lucide-react"


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
    title: "Materiales",
    url: "/app/dashboard",
    icon: Home,
  },
  {
    title: "Tools",
    url: "/app/addTool",
    icon: Drill,
  },
  {
    title: "Departamentos",
    url: "/app/departments",
    icon: DoorOpen,
  },
  {
    title: "Grupo",
    url: "#",
    icon: UsersRound,
  },
  {
    title: "Voluntarios",
    url: "#",
    icon: HandHelping,
  },
  {
    title: "Configuración",
    url: "#",
    icon: Settings,
  },
  
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