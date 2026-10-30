export type Variant = {
  id: number;
  title: string;
  size: string;
  price: number;
  compareAt: number | null;
  available: boolean;
};

export type ProductImage = { src: string; width: number; height: number };

export type Product = {
  id: number;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  images: ProductImage[];
  variants: Variant[];
  price: number;
  compareAt: number | null;
  available: boolean;
  kit: Kit | null;
};

export type Kit = "home" | "away" | "third" | "fourth" | "keeper";

export type CartLine = {
  key: string;
  variantId: number;
  handle: string;
  title: string;
  size: string;
  price: number;
  image: string | null;
  qty: number;
  print?: { name: string; number: string };
};
