import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';

const MovimientosM = [
  "entry", "exit"
] as const;

const Medidas = [ "Select",
  "Kg", "Mts", "Cms", "Caja", "Unidad", "Paquete", "Litro", "Gramo", "Pieza", "Bolsa", "Otro"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  unit: z.enum(Medidas),
  department_id: z.string().min(1, 'El departamento es requerido'),
  movementType: z.enum(MovimientosM),
  description: z.string().optional(),
});

function AddMaterialForm() {
  const [departments, setDepartments] = useState<any[]>();
  const user = useAuthenticationStore((state) => state.user);

  useEffect(() => {
    const fetchDepartments = async ()=> {
      const {data, error } = await supabase
      .from("departments")
      .select("id, name");
      if (error) {
        console.error("Error al cargar departamentos:", error );
      } else {
        setDepartments(data || []);
      }
    };
    fetchDepartments();
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'Select',
      department_id: '',
      movementType: 'entry',
      description: '',
    },
  });

 const onSubmit = async (values: z.infer<typeof schema>) => {
  try {
    //insertar material
    const {data: material, error: matError} = await supabase
     .from("inventory")
     .insert([
      {
        name: values.name,
        quantity: values.quantity,
        description: values.description,
        department_id: values.department_id,
        unit: values.unit,
      },
     ])
     .select()
     .single();

    if (matError) throw matError;

    //insertar mov en activity
    const { error: actError } = await supabase.from("activity").insert([
      {
        name: values.name,
        movementType: values.movementType,
        created_by: user?.id,
        created_at: new Date(),
      },
    ]);

    if (actError) throw actError;
    console.log("MATERIAL Y ACTIVITY CREADOS");
  } catch (err) {
    console.error("ERROR AL INTENTAR CREAR:", err);
  }
 };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="">Selecciona la unidad</option>
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>

      <Label htmlFor="departments">Departamento</Label>
      <select id="departments" {...form.register('department_id')} className="border rounded p-2">
        <option value="">Selecciona un departamento</option>
        {(departments ?? []).map((dep) => (
          <option key={dep.id} value={dep.id.toString()}>
            {dep.name}
          </option>
        ))}
      </select>

      <Label htmlFor="description">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit" >Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;
