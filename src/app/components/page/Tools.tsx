//form to add a new tool

import Layout from "@/app/components/layout";
import AddToolForm from "../addTool-form";
import { supabase } from "@/app/lib/supabaseClient";
import { useAuthenticationStore } from "@/app/store/authentication";

export function AddTool() {
  return (
    <Layout>
      <div className="flex flex-col h-screen w-[100%] self-center gap-4 m-2">
        
        <div className=" bg-white p-6 rounded-lg shadow-md mb-4">
          <h3 className="text-xl font-semibold p-2">Agregar Herramienta</h3>
          <AddToolForm />
        </div>

        <div className="flex-end flex-1 text-end justify-end bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Información del Sistema</h3>
          <p className="mt-2 text-gray-600">
            <span className="font-bold">Agrega aqui las herramientas que el grupo posee </span> 
          </p>
        </div>
      </div>
    </Layout>
  );
}
export default AddTool;
