import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type Material = {
    id: string
    name: string
    quantity: number
}

export default function MaterialsList() {
    const [materials, setMaterials] = useState<Material[]>([])
    const [loading, setLoading] = useState(true)


useEffect(() => {
    const fetchMaterials = async() => {
        const { data, error } = await supabase
        .from("Inventory")
        .select("id, name, quantity")
        .order("name", { ascending: true})

        if (error) {
            console.error("Error cargando materiales:", error.message)
        } else {
            setMaterials(data || [])
        }
        setLoading(false)
    }
    fetchMaterials()
},[])
     if (loading) return <p>Cargando Materiales</p>

     return(
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Materiales</h2>
            {materials.length === 0 ? (
                <p>No hay materiales registrados</p>
            ) : (
                <ul className="space-y-2">
                    {materials.map((m) => (
                        <li key={m.id}
                            className="border p-2 rounded flex justify-between items-center">
                            <span>{m.name}</span>
                            <span className="font-semibold">{m.quantity}</span>

                        </li>
                    ))}
                </ul>
            )}
        </div>
     )
 }
