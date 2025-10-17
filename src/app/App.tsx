import Login from "@/app/components/page/Login";
import Inventario from "@/app/components/page/Inventory";
import Home from "./components/page/Home";
import SearchPage from "@/app/components/page/Search";
import { useEffect } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuthenticationStore } from "@/app/store/authentication";
import { supabase } from "@/app/lib/supabaseClient";
import { Movements } from "./components/page/Movements";
import Shop from "@/app/components/page/Shop";
import SignUp from "@/app/components/page/SignUp";


export default function App() {
  const { setSession } = useAuthenticationStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <>
    
    <Router>
    
      <Routes>
        <Route path="/app" element={<Login />} />
        <Route path="/app/signUp" element={<SignUp />} />

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

        <Route
          path="/app/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/movements"
          element={
            <ProtectedRoute>
              <Movements />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/lista"
          element={
            <ProtectedRoute>
              <Shop />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </>
  );
}
