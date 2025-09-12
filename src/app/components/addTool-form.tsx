import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';

const MovimientosT = ["entry", "exit", "repair", "discard"] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  buyDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
  warranty: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().optional()
  ),
  department_id: z.string().min(1, 'El departamento es requerido'),
  description: z.string().optional(),
  movementType: z.enum(MovimientosT),
});

function AddToolForm() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name');
      if (error) {
        console.error('Error al cargar los departamentos:', error);
      } else {
        setDepartments(data || []);
      }
    };
    fetchDepartments();
  }, []);

  type AddToolFormValues = z.infer<typeof schema>;
  const form = useForm<AddToolFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      quantity: 0,
      buyDate: new Date(),
      warranty: new Date(),
      department_id: '',
      description: '',
      movementType: 'entry',
    },
  });

  const onSubmit = async (values: AddToolFormValues) => {
    try {
      const depId = Number(values.department_id);

      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .insert([
          {
            name: values.name,
            amount: values.quantity,
            purchase_date: values.buyDate.toISOString(),
            warrantyExpirationDate: values.warranty?.toISOString(),
            department_id: depId,
            description: values.description,
          },
        ])
        .select()
        .single();

      if (toolError) throw toolError;

      // 2️⃣ Crear el movimiento inicial (entrada)
      const { error: movementError } = await supabase.from('activity').insert([
        {
          tool_id: toolData.id,
          activity_type: values.movementType,
          quantity: values.quantity,
          department_id: depId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (movementError) throw movementError;

      setTools([...tools, toolData]);
      form.reset();

      console.log('Herramienta y movimiento creados:', toolData);
    } catch (error) {
      console.error('Error al crear la herramienta:', error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input
        id="quantity"
        type="number"
        {...form.register('quantity', { valueAsNumber: true })}
        placeholder="Cantidad"
      />

      <Label htmlFor="buyDate">Fecha de Compra</Label>
      <Input id="buyDate" type="date" {...form.register('buyDate')} />

      <Label htmlFor="warranty">Fecha Vencimiento de la Garantía</Label>
      <Input id="warranty" type="date" {...form.register('warranty')} />

      <Label htmlFor="department">Departamento</Label>
      <select
        id="department"
        {...form.register('department_id')}
        className="border rounded p-2"
      >
        <option value="">Selecciona un departamento</option>
        {departments.map((dep) => (
          <option key={dep.id} value={dep.id.toString()}>
            {dep.name}
          </option>
        ))}
      </select>

        {/* por ahora el form es solo para cargar una herramienta nueva. */}
        
       {/* <Label htmlFor="movementType">Tipo de movimiento</Label>
      <select
        id="movementType"
        {...form.register('movementType')}
        className="border rounded p-2"
      >
        {MovimientosT.map((mov) => (
          <option key={mov} value={mov}>
            {mov}
          </option>
        ))}
      </select> */}

      <Label htmlFor="description">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit">Confirmar</Button>
    </form>
  );
}

export default AddToolForm;
