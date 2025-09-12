import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const getImageFrom = (
  image:
    | string
    | { formats: { small: { url: string }; thumbnail: { url: string } } },
  format: "small" | "thumbnail",
): string => {
  if (typeof image === "string") {
    return new URL(image).toString();
  }

  return new URL(image?.formats?.[format]?.url).toString();
};
