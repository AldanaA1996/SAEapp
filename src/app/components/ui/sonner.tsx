import { Toaster as Sonner } from "sonner";

// Minimal wrapper compatible with Astro + React without next-themes
// Accept any props and forward to Sonner
// You can adjust theme to "system" if you later add a theme provider
const Toaster = (props: any) => {
  return (
    <Sonner theme="light" {...props} />
  );
};

export { Toaster }
