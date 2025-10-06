import { useState } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';
import { useSearch } from '../hooks/use-material-search';

const schema = z.object({

materialId: z.string().min(1, 'Debes seleccionar un material.'),
quantity: z.number().min(1, 'La cantidad a retirar debe ser mayor a 0.'),

});

export type Material = {
id: string;
name: string;
quantity: number;
unit: string;
};

function EgressMaterialForm() {

const {materials, isLoading, setSearchTerm, searchTerm, setMaterials } = useSearch();
const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
const [error, setError] = useState<string | null>(null);

const user = useAuthenticationStore((state) => state.user);

const form = useForm<z.infer<typeof schema>>({

resolver: zodResolver(schema),
defaultValues: {
materialId: '',
quantity: 0,
},
});

const onSubmit = async (values: z.infer<typeof schema>) => {
setError(null);
if (!selectedMaterial) {
setError("Por favor, selecciona un material de la lista.");
return;
}

if (values.quantity > selectedMaterial.quantity) {
setError(`No puedes retirar más de la cantidad disponible (${selectedMaterial.quantity}).`);
form.setError("quantity", { message: "Cantidad excede el stock." });
return;
}

try {
const newQuantity = selectedMaterial.quantity - values.quantity;

const { error: updateError } = await supabase
.from('inventory')
.update({ quantity: newQuantity })
.eq('id', selectedMaterial.id);
if (updateError) throw updateError;

const { error: activityError } = await supabase.from("activity").insert([

{
name: selectedMaterial.id,
movementType: 'exit',
quantity: values.quantity,
created_by: user?.id,
created_at: new Date().toLocaleTimeString('en-GB'),
created_date: new Date().toISOString(),
},
]);

if (activityError) throw activityError;

form.reset();
setSearchTerm('');
setSelectedMaterial(null);



alert(`¡Retiro exitoso!\n\nMaterial: ${selectedMaterial.name}\nCantidad Retirada: ${values.quantity}\nNuevo Stock: ${newQuantity}`);
// Para demostrar que la base de datos simulada se actualizó, lo mostramos en la consola.
console.log(`INVENTARIO SIMULADO ACTUALIZADO: ${newQuantity}` );
} catch (err: any)

{
console.error("Error al retirar el material:", err);
setError("Ocurrió un error al procesar el egreso. Intenta de nuevo.");
}
};

const handleSelectMaterial = (material: Material) => {
setSelectedMaterial(material);
form.setValue('materialId', material.id, { shouldValidate: true });
setSearchTerm(material.name);
setMaterials([]);
}

return (

<div className="p-4 bg-gray-50 rounded-lg shadow-md">
<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 relative">
<div className="flex flex-col gap-2">
<Label htmlFor="search">Buscar Material</Label>
<Input
id="search"
value={searchTerm}
onChange={(e) => {
setSearchTerm(e.target.value);

if(selectedMaterial) setSelectedMaterial(null);

form.setValue('materialId', '', { shouldValidate: true });
}}

placeholder="Escribe para buscar..."

autoComplete="off"

/>

{materials.length > 0 && (
<ul className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
{materials.map((material: Material) => (

<li
key={material.id}
className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
onClick={() => handleSelectMaterial(material)}
>

{material.name} (Disp: {material.quantity} {material.unit})
</li>
))}

</ul>
)}
{isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
</div>

{selectedMaterial && (

<>
<p className="text-sm p-2 bg-blue-50 border border-blue-200 rounded-md">
<span className="font-semibold">Seleccionado:</span> {selectedMaterial.name} <br />
<span className="font-semibold">Cantidad Disponible:</span> {selectedMaterial.quantity} {selectedMaterial.unit}
</p>

<Label htmlFor="quantity">Cantidad a Retirar</Label>

<Input
id="quantity"
type="number"
{...form.register('quantity', { valueAsNumber: true })}
placeholder="Cantidad"
max={selectedMaterial.quantity}
min="1"
/>
{form.formState.errors.quantity && <p className="text-red-500 text-sm">{form.formState.errors.quantity.message}</p>}
</>
)}

{error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
<Button type="submit" disabled={!selectedMaterial || form.formState.isSubmitting}>
Retirar Material
</Button>
</form>
</div>
);
}

export default EgressMaterialForm;