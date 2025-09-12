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
    setSession: (session) => {
        set({
            token:session?.access_token ?? null,
            user: session?.user ?? null,
        })
    },
    logout: async ()=> {
        await supabase.auth.signOut()
        set({ token: null, user:null })
    },
}))