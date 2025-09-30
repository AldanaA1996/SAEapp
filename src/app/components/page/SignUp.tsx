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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Regístrate en SAEapp para comenzar
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
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre y Apellido
                  </label>
                  <Input
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
                <label htmlFor="numeroVoluntario" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de voluntario
                </label>
                <Input
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
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input
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
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <Input
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center space-y-2">
            <div className="flex justify-between w-full text-sm">
              <span className="text-gray-500">¿Ya tienes una cuenta?</span>
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
