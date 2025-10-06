import {create } from "zustand"
import { supabase } from "@/app/lib/supabaseClient"

type AuthState = {
    token: string | null
    user: any | null
    setSession: (session:any) => void
    logout: () => Promise<void>
}

export const useAuthenticationStore = create<AuthState>((set)=> ({
    token: null,
    user: null,
    setSession: async (session) => {
        const authUser = session?.user ?? null;
        set({
          token: session?.access_token ?? null,
          user: authUser,
        });
      
        if (authUser) {
          // Verificar si ya existe en tu tabla "user"
          const { data: existingUser, error } = await supabase
            .from("user")
            .select("*")
            .eq("userAuth", authUser.id)
            .maybeSingle();
    
        }
      },
    logout: async ()=> {
        await supabase.auth.signOut()
        set({ token: null, user:null })
    },
}))