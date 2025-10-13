import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
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

export default function SignUp() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroVoluntario, setNumeroVoluntario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/home`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        console.log("Usuario registrado:", data);
        // Crear registro relacionado en tabla 'user' inmediatamente
        if (data.user) {
          const authId = data.user.id;
          const numeroParsed = numeroVoluntario?.trim() ? Number(numeroVoluntario) : null;
          const { error: insertErr } = await supabase
            .from("user")
            .insert([
              {
                userAuth: authId,
                email,
                name: nombre || null,
                volunteerNumber: numeroParsed,
              },
            ]);
          if (insertErr) {
            setError("No se pudo crear el usuario en la base de datos.");
            console.error("Error insertando en tabla user:", insertErr);
            setLoading(false);
            return;
          }
        }
        setSuccess(true);
        // Si el email no necesita confirmación, redirigir automáticamente
        if (data.user && !data.user.email_confirmed_at) {
          setTimeout(() => {
            window.location.href = "/app/home";
          }, 3000);
        }
      }
    } catch (err: any) {
      setError("Error inesperado al crear la cuenta");
      console.error("Error en sign up:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/home`
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // No setLoading(false) aquí porque la redirección es externa
    } catch (err: any) {
      setError("Error inesperado con Google Sign Up");
      console.error("Error en Google sign up:", err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">
                ¡Cuenta creada exitosamente!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Revisa tu correo electrónico para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                <p className="text-sm text-green-600">
                  Hemos enviado un enlace de confirmación a <strong>{email}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Haz clic en el enlace para activar tu cuenta y poder iniciar sesión.
              </p>
              <Button
                onClick={() => window.location.href = "/app"}
                className="w-full"
              >
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{
      backgroundImage: 'url(/images/bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      <div className="max-w-md w-full space-y-8">
        <Card className=" shadow-lg bg-blue-200/40 backdrop-blur rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl  text-black">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-black">
              Regístrate en LEIA para comenzar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignUp}>
              
                <div>
                  <label htmlFor="nombre" className="block text-sm  text-white mb-1">
                    Nombre y Apellido
                  </label>
                  <Input
                    className="bg-white w-full"
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
              <div>
                <label htmlFor="numeroVoluntario" className="block text-sm text-white mb-1">
                  Número de voluntario
                </label>
                <Input
                  className="bg-white w-full"
                  id="numeroVoluntario"
                  name="numeroVoluntario"
                  type="number"
                  placeholder="1234"
                  value={numeroVoluntario}
                  onChange={(e) => setNumeroVoluntario(e.target.value)}
                  disabled={loading}
                  min={0}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm  text-white mb-1">
                  Correo Electrónico
                </label>
                <Input
                  className="bg-white w-full"
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm  text-white mb-1">
                  Contraseña
                </label>
                <Input
                  className="bg-white w-full"
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-white mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-white mb-1">
                  Confirmar Contraseña
                </label>
                <Input
                  className="bg-white w-full"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div className="flex justify-center">
              <Button
              
                type="submit"
                className="w-full md:w-4/5 lg:w-3/5 mt-4 bg-green-950 hover:bg-green-800"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
              </div>
            </form>

              
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center space-y-2">
            <div className="flex justify-between w-full text-sm">
              <span className="text-white">¿Ya tienes una cuenta?</span>
              <a className="text-blue-600 hover:text-blue-500 font-medium" href="/app">
                Iniciar sesión
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
