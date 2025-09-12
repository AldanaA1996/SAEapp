import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

type Department = {
  id: string;
  name: string;
};

export default function DepartmentsGrid() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("departments").select("id, name");
      if (error) {
        console.error("Error fetching departments:", error.message);
      } else {
        setDepartments(data || []);
      }
      setLoading(false);
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Cargando departamentos...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dep) => (
        <div
          key={dep.id}
          onClick ={()=> navigate(`/app/departments/${dep.id}`)} 
          className="p-4 border rounded-lg shadow hover:bg-gray-100"
        >
          <h2 className="text-xl font-bold">{dep.name}</h2>
        </div>
      ))}
    </div>
  );
}
