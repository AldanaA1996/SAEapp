import {useState} from "react"
import {supabase} from "@/app/lib/supabaseClient"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export default function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string |null>(null);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } else {
      console.log("Sesion Iniciada:", data);
      window.location.href ="/app/home";
    }
  };

  return (

    <div className="min-h-screen h-full w-full flex items-center justify-center">
      <Card className="bg-blue-200/40 w-full mx-6 md:mx-0 md:w-96 sm:w-96% backdrop-blur border-none rounded-xl shadow-lg ">
        <CardHeader className="flex flex-col items-center text-center">
          <img src="/images/logo.png" alt="Logo LEIA" className="w-18 h-18 mb-4" />
          <CardTitle className="text-2xl font-bold text-white">Bienvenido a LEIA</CardTitle>
         <CardDescription className="text-center text-sm text-green-950">
            Inicia sesión para continuar
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6">
          
          <form
            className="flex flex-col w-full gap-4"
            onSubmit={handleLogin}
          >
            <fieldset className="contents w-full">
              <Input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white w-full"
              />

              <Input
                required
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white w-full"
              />

              {error && (
                <div className="flex justify-center">
                  <p className="text-red-500">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-950 hover:bg-green-800"
                onSubmit={handleLogin}
              >
                Iniciar sesión
              </Button>
            </fieldset>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center">
          <div className="flex justify-between pb-4 w-full ">
            <p className="text-sm text-green-950">¿No tienes una cuenta?</p>
            <a className="text-sm text-green-200 hover:text-green-400 underline" href="/app/signup">
              Regístrate
            </a>
          </div>
          <div className="flex justify-end border-t border-gray-300 pt-4 w-full">
            <a className="text-sm text-green-200 hover:text-green-400 underline" href="/forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
