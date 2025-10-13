export type Material = {
  id: string;
  name: string;
  manufactur: string;
  quantity: number;
  unit: string;
  location: "Select" | "Pañol" | "Taller" | "Contenedor" | "Ferreteria";
};
