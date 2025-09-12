import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';


  

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  buyDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().refine((date) => date >= new Date(), {
      message: 'La fecha de compra debe ser mayor o igual a hoy',
    })
    ),
  warranty: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().refine((date) => date >= new Date(), {
      message: 'La garantía debe ser mayor o igual a hoy',
    })
    ),
  department: z.string().min(1, 'El departamento es requerido'),
  description: z.string().optional(),
});

  function AddToolForm() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);

    useEffect(() => {
      const fetchDepartments = async () => {
        const deptResponse = await getAllDepartments();
        setDepartments(deptResponse.data);
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
        department: '',
        description: '',
      },
    });
    const onSubmit = async (values: z.infer<typeof schema>) => {
      try {
        const depId = Number(values.department);
        const depObj = departments.find((dept) => dept.id === depId);
        if (!depObj) {
          throw new Error('Departamento no encontrado');
        }
        //crear nueva  herramienta
     
     const newTool = await createTool({
          name: values.name,
          amount: values.quantity,
          purchase_date: values.buyDate,
          warrantyExpirationDate: values.warranty,
          department: depObj.id,
          description: values.description,
        });
        setTools([...tools, newTool.data]);
        form.reset();
      } catch (error) {
        console.error('Error al crear la herramienta:', error);
      }
    };
  
return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="buyDate">Fecha de Compra</Label>
      <Input id="buyDate" type="date" {...form.register('buyDate', { valueAsNumber: true })} placeholder="Fecha de Compra" />

      <Label htmlFor="garanty">Fecha Vencimiento de la Garantia</Label>
      <Input id="garanty" type="date" {...form.register('warranty', { valueAsNumber: true })} placeholder="Garantia" />

      <Label htmlFor="department">Departamento</Label>
      <select id="department" {...form.register('department')} className="border rounded p-2">
        <option value="">Selecciona un departamento</option>
        {departments.map((dep) => (
          <option key={dep.id} value={dep.id.toString()}>
            {dep.name}
          </option>
        ))}
      </select>



      <Label htmlFor="description">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit">Confirmar</Button>
    </form>
  );
}

export default AddToolForm;
