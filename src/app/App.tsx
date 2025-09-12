import Login from "@/app/components/page/Login";
import Dashboard from "@/app/components/page/Dashboard";
import Home from "./components/page/Home";
import DepartmentsPage from "@/app/components/page/departments/DepartmentsPage";
import DepartmentDetailPage from "@/app/components/page/departments/[id]";
import ToolsPage from "@/app/components/page/Tools";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes  } from "react-router-dom";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuthenticationStore } from "@/app/store/authentication";
import { useParams as useReactRouterParams } from "react-router-dom";
import { supabase } from "@/app/lib/supabaseClient";


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
                    path="/app/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                    
                <Route path="/app/departments" 
                        element={
                            <ProtectedRoute>
                                <DepartmentsPage />
                            </ProtectedRoute>
                        }
                    />
                <Route path="/app/departments/:documentId" 
                        element={
                            <ProtectedRoute>
                              <DepartmentDetailPage/>
                            </ProtectedRoute>
                        }
                    />

                <Route path="/app/addTool"
                    element={
                            <ProtectedRoute>
                                <ToolsPage />
                            </ProtectedRoute>
                        }
                    />
                
            </Routes>
        </Router>
    )
}