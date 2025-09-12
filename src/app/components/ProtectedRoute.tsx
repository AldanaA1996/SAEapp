import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/login"; // no logueado
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Cargando...</div>;

  return <>{session && children}</>;
}
