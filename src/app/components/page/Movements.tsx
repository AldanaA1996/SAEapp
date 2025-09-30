import Layout from "@/app/components/layout";
import MovementsView from "../movementsView";

export function Movements() {
  return (
    <Layout>
      <div className="flex flex-col h-screen w-[100%] self-center gap-4 m-2">
      <MovementsView />
      </div>
    </Layout>
  );
}