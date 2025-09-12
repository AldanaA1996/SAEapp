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
    <Card className="w-96 mx-auto mt-20 bg-gray shadow-lg p-6 justify-center">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicia Sesión</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleLogin}
        >
          <fieldset className="contents">
            <Input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              
            />

            <Input
              required
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              
            />

            <Button
              type="submit"
              className="w-full"
              onSubmit={handleLogin}
            >
              Iniciar sesión
            </Button>
          </fieldset>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center">
        <div className="flex justify-between pb-4 w-full">
          <p className="text-sm text-gray-500">¿No tienes una cuenta?</p>
          <a className="text-sm text-blue-400" href="/register">
            Regístrate
          </a>
        </div>
        <div className="flex justify-end border-t border-gray-300 pt-4 w-full">
          <a className="text-sm text-blue-400" href="/forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
