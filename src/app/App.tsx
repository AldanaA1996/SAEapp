import Login from "@/app/components/page/Login";
import Inventario from "@/app/components/page/Inventory";
import Home from "./components/page/Home";
import DepartmentsPage from "@/app/components/page/departments/DepartmentsPage";
import DepartmentDetailPage from "@/app/components/page/departments/[id]";
import ToolsPage from "@/app/components/page/Tools";
import SearchPage from "@/app/components/page/Search";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes  } from "react-router-dom";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuthenticationStore } from "@/app/store/authentication";
import { useParams as useReactRouterParams } from "react-router-dom";
import { supabase } from "@/app/lib/supabaseClient";
import { Movements } from "./components/page/Movements";
import { Toaster } from "@/app/components/ui/sonner";

export default function App() {
   const { setSession } = useAuthenticationStore()
 
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) =>{
            if (data.session) {
                setSession(data.session)
            }
        })
    
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
    })

    return() => subscription.unsubscribe()
}, [setSession])

   

    return (
        <Router>
            <Toaster richColors position="top-center" closeButton />
            <Routes>
                <Route path="/app" element={<Login />} />
              

                {/* Protected route for the dashboard page */}
                 <Route
                    path="/app/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/inventario"
                    element={
                        <ProtectedRoute>
                            <Inventario />
                        </ProtectedRoute>
                    }
                />
                    
                {/* <Route path="/app/departments" 
                        element={
                            <ProtectedRoute>
                                <DepartmentsPage />
                            </ProtectedRoute>
                        }
                    /> */}
                {/* <Route path="/app/departments/:documentId" 
                        element={
                            <ProtectedRoute>
                              <DepartmentDetailPage/>
                            </ProtectedRoute>
                        }
                    /> */}

                <Route path="/app/addTool"
                    element={
                            <ProtectedRoute>
                                <ToolsPage />
                            </ProtectedRoute>
                        }
                    />
                
                <Route path="/app/search"
                    element={
                            <ProtectedRoute>
                                <SearchPage />
                            </ProtectedRoute>
                        }
                    />
                
                <Route path="/app/movements"
                    element={
                            <ProtectedRoute>
                                <Movements />
                            </ProtectedRoute>
                        }
                    />
                
            </Routes>
        </Router>
    )
}