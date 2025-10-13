import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';
import { useSearch } from '../hooks/use-material-search';
import type { Material } from '../lib/types';

const schema = z.object({
  materialId: z.string().min(1, 'Debes seleccionar un material.'),
  quantity: z.number().min(1, 'La cantidad a retirar debe ser mayor a 0.'),
});

function EgressMaterialForm() {
  const { materials, isLoading, setSearchTerm, searchTerm, setMaterials } = useSearch();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthenticationStore((state) => state.user);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      materialId: '',
      quantity: 1,
    },
  });

  const getDbUserId = async (): Promise<number | null> => {
    if (!user?.id) return null;

    const { data: dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando user.id:", error);
      toast.error("Error buscando usuario en la base");
      return null;
    }

    if (!dbUser) {
      toast.error("El usuario logueado no está vinculado en la tabla user");
      return null;
    }

    return dbUser.id;
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    console.log('onSubmit called with values:', values);
    setError(null);
    
    if (!selectedMaterial) {
      setError("Por favor, selecciona un material de la lista.");
      toast.error("Por favor, selecciona un material de la lista.");
      return;
    }

    if (!values.quantity || values.quantity <= 0 || isNaN(values.quantity)) {
      setError("Debes ingresar una cantidad válida mayor a 0.");
      toast.error("Cantidad inválida");
      return;
    }

    if (values.quantity > selectedMaterial.quantity) {
      setError(`No puedes retirar más de la cantidad disponible (${selectedMaterial.quantity}).`);
      form.setError("quantity", { message: "Cantidad excede el stock." });
      toast.error("Cantidad excede el stock disponible");
      return;
    }

    try {
      const newQuantity = selectedMaterial.quantity - values.quantity;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', selectedMaterial.id);
      
      if (updateError) throw updateError;

      // Registrar actividad con formato consistente
      const now = new Date();
      const horaActual = now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fechaActual = now.toLocaleDateString("es-AR", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') + 'T' + now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const createdBy = user?.id ?? null;
      const userCreatorId = await getDbUserId();

      const { error: activityError } = await supabase.from("activity").insert([
        {
          name: selectedMaterial.id,
          movementType: 'exit',
          user_creator: userCreatorId,
          created_by: createdBy,
          created_at: horaActual,
          created_date: fechaActual,
          quantity: values.quantity,
        },
      ]);

      if (activityError) throw activityError;

      // Resetear formulario
      form.reset();
      setSearchTerm('');
      setSelectedMaterial(null);

      // Notificación de éxito
      toast.success('Egreso registrado exitosamente', {
        description: `Material: ${selectedMaterial.name} | Cantidad: ${values.quantity} | Nuevo stock: ${newQuantity}`,
      });
    } catch (err: any) {
      console.error("Error al retirar el material:", err);
      setError("Ocurrió un error al procesar el egreso. Intenta de nuevo.");
      toast.error("Error al registrar el egreso");
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    form.setValue('materialId', material.id, { shouldValidate: true });
    setSearchTerm(material.name);
    setMaterials([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted via handleFormSubmit');
    const formData = form.getValues();
    console.log('Form data:', formData);
    onSubmit(formData);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-md">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 relative">
          <Label htmlFor="search">Buscar Material</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedMaterial) setSelectedMaterial(null);
              form.setValue('materialId', '', { shouldValidate: true });
            }}
            placeholder="Escribe para buscar..."
            autoComplete="off"
          />

          {materials.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {materials.map((material: Material) => (
                <li
                  key={material.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectMaterial(material)}
                >
                 <span className="font-bold">{material.name}</span> {material.manufactur} | (Disp: {material.quantity} {material.unit}) | {material.location}
                </li>
              ))}
            </ul>
          )}
          {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
        </div>

        {selectedMaterial && (
          <>
            <p className="text-sm p-2 bg-blue-50 border border-blue-200 rounded-md">
              <span className="font-semibold">Seleccionado:</span> {selectedMaterial.name}, {selectedMaterial.manufactur} (Disp: {selectedMaterial.quantity} {selectedMaterial.unit}), {selectedMaterial.location}
            </p>

            <div>
              <Label htmlFor="quantity">Cantidad a Retirar</Label>
              <Input
                id="quantity"
                type="number"
                {...form.register('quantity', { 
                  valueAsNumber: true,
                  required: "La cantidad es requerida",
                  min: { value: 1, message: "La cantidad debe ser mayor a 0" }
                })}
                placeholder="Ingresa la cantidad"
                max={selectedMaterial.quantity}
                min="1"
                step="1"
              />
              {form.formState.errors.quantity && (
                <p className="text-red-500 text-sm">{form.formState.errors.quantity.message}</p>
              )}
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
        
        {/* Debug info
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500">
            <p>Material seleccionado: {selectedMaterial ? 'Sí' : 'No'}</p>
            <p>Form valid: {form.formState.isValid ? 'Sí' : 'No'}</p>
            <p>Submitting: {form.formState.isSubmitting ? 'Sí' : 'No'}</p>
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-red-500">Errores: {JSON.stringify(form.formState.errors)}</p>
            )}
          </div>
        )} */}
        
        <Button 
          type="submit" 
          disabled={!selectedMaterial || form.formState.isSubmitting}
          onClick={() => console.log('Button clicked, selectedMaterial:', selectedMaterial)}
        >
          {form.formState.isSubmitting ? "Procesando..." : "Retirar Material"}
        </Button>
      </form>
    </div>
  );
}

export default EgressMaterialForm;