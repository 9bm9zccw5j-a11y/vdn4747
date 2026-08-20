export interface Product {
  id: number;
  name: string;
  price: number;
  /** Старая цена до скидки. Показывается зачёркнутой, если она выше price. */
  oldPrice?: number;
  description: string;
  inStock: boolean;
  category: string;
  subcategory?: string;
  code: string;
  image?: string;
  /** Галерея изображений товара (dataURL или URL). */
  gallery?: string[];
  characteristics?: ProductCharacteristic[];
  /** Единица измерения: "шт" (по умолчанию) или "м" (за метр). */
  unit?: "шт" | "м";
  /** Минимальное количество метров для продажи (если unit === "м"). */
  minMeters?: number;
}

export interface ProductCharacteristic {
  name: string;
  value: string;
}

export interface Subcategory {
  key: string;
  label: string;
  img?: string;
  /** Для старого каталога PPR: автоматическая привязка по части названия. */
  match?: string[];
}

export interface Category {
  key: string;
  label: string;
  img: string;
  subcategories?: Subcategory[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    key: "ppr",
    label: "PPR трубы и фитинги",
    img: "/images/cat-ppr.png",
    subcategories: [
      { key: "ppr-pipe", label: "PPR Труба", match: ["Труба"] },
      { key: "ppr-coupling", label: "PPR Муфта", match: ["Муфта"] },
      { key: "ppr-elbow", label: "PPR Уголок", match: ["Угольник", "Колено"] },
      { key: "ppr-union", label: "PPR Американка", match: ["Американка"] },
      { key: "ppr-valve", label: "PPR Кран", match: ["Кран"] },
      { key: "ppr-cross", label: "PPR Крестовина", match: ["Крестовина"] },
      { key: "ppr-cap", label: "PPR Заглушка", match: ["Заглушка"] },
    ],
  },
  { key: "Латунные Фитинги", label: "Латунь", img: "/images/cat-brass.png" },
  { key: "Краны и Вентили", label: "Краны", img: "/images/cat-valves.png" },
];

export const DEFAULT_PRODUCTS: Product[] = [];
