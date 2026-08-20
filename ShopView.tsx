import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Menu as MenuIcon,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  X,
  Heart,
  Home,
  LayoutGrid,
  Truck,
  ShieldCheck,
  Wallet,
  Flame,
  Sparkles,
  Plus,
  Minus,
  Clock,
  Rows3,
  Phone,
  Droplets,
  Zap,
  Award,
} from "lucide-react";
import type { Category, Product, Subcategory } from "../data/catalog";
import type { MediaItem } from "../hooks/useMediaLibrary";

/* ================= helpers ================= */
export interface ShopCartItem {
  product: Product;
  quantity: number;
  meters?: number;
}

const money = (n: number) => n.toLocaleString("ru-RU");

/** Процент скидки, если задана старая цена выше текущей. */
const discountPercent = (p: Product): number | null => {
  if (!p.oldPrice || p.oldPrice <= p.price) return null;
  return Math.max(1, Math.round((1 - p.price / p.oldPrice) * 100));
};

/** Зачёркнутая старая цена — показывается только при реальной скидке. */
function OldPrice({ p, size = "sm" }: { p: Product; size?: "sm" | "lg" }) {
  const d = discountPercent(p);
  if (!d) return null;
  return (
    <span
      className={`font-bold text-slate-400 line-through decoration-rose-400/70 decoration-2 ${
        size === "lg" ? "text-[16px] lg:text-[18px]" : "text-[11px] lg:text-[12.5px]"
      }`}
    >
      {money(p.oldPrice!)} ₽
    </span>
  );
}

/** Красный бейдж «−X%» для угла изображения. */
function DiscountBadge({ p }: { p: Product }) {
  const d = discountPercent(p);
  if (!d) return null;
  return (
    <motion.span
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1, rotate: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.15 }}
      className="absolute left-2 top-2 z-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 px-2 py-1 text-[10px] font-black text-white shadow-md shadow-rose-500/30"
    >
      −{d}%
    </motion.span>
  );
}
const minMeters = (p: Product) => (p.minMeters && p.minMeters > 0 ? p.minMeters : 1);
const itemTotal = (i: ShopCartItem) =>
  i.product.unit === "м" && i.meters
    ? i.product.price * i.meters * i.quantity
    : i.product.price * i.quantity;

const catKeyOf = (p: Product) =>
  p.category === "PPR Трубы" || p.category === "PPR Фитинги" ? "ppr" : p.category;

const matchSub = (p: Product, sub: Subcategory) =>
  p.subcategory === sub.key ||
  (!p.subcategory && !!sub.match?.some((m) => p.name.includes(m)));

const thumbOf = (p: Product) =>
  p.gallery?.[0] ||
  p.image ||
  (p.category === "Краны и Вентили"
    ? "/images/cat-valves.png"
    : p.category === "Латунные Фитинги"
    ? "/images/cat-brass.png"
    : "/images/cat-ppr.png");

const FAV_KEY = "vodyanoy_favorites_v1";
const SEEN_KEY = "vodyanoy_recent_v1";

/* ================= UI атомы ================= */
function StockPill({ ok, lg }: { ok: boolean; lg?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-black ${
        lg ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]"
      } ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
    >
      {ok ? <CheckCircle2 size={lg ? 12 : 10} /> : <XCircle size={lg ? 12 : 10} />}
      {ok ? "В наличии" : "Под заказ"}
    </span>
  );
}

function FavBtn({
  active,
  onClick,
  size = 15,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={onClick}
      className={`rounded-full p-1.5 shadow-sm backdrop-blur-md transition ${
        active
          ? "bg-rose-500 text-white shadow-rose-500/30"
          : "bg-white/85 text-slate-400 hover:text-rose-400"
      }`}
    >
      <Heart size={size} fill={active ? "currentColor" : "none"} strokeWidth={2.4} />
    </motion.button>
  );
}

/* ================= Карточка товара ================= */
function ProductCard({
  p,
  onOpen,
  onAdd,
  inCart,
  fav,
  onFav,
  badge,
  wide,
}: {
  p: Product;
  onOpen: () => void;
  onAdd: () => void;
  inCart?: ShopCartItem;
  fav: boolean;
  onFav: () => void;
  badge?: { text: string; cls: string };
  wide?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`group flex overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(15,60,70,0.06)] ring-1 ring-slate-100 transition-shadow hover:shadow-[0_12px_40px_rgba(15,60,70,0.14)] ${
        wide ? "flex-row" : "flex-col"
      }`}
    >
      <button
        onClick={onOpen}
        className={`relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 ${
          wide ? "h-32 w-32 shrink-0 sm:h-40 sm:w-40" : "aspect-square w-full"
        }`}
      >
        <img
          src={thumbOf(p)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {discountPercent(p) !== null ? <DiscountBadge p={p} /> : null}
        {badge && (
          <span
            className={`absolute bottom-2 right-2 rounded-lg px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wide text-white shadow-sm ${badge.cls}`}
          >
            {badge.text}
          </span>
        )}
        {!p.inStock && (
          <span className="absolute bottom-2 left-2 rounded-lg bg-amber-500/95 px-2 py-0.5 text-[9.5px] font-black text-white">
            Под заказ
          </span>
        )}
        <span className="absolute right-2 top-2">
          <FavBtn active={fav} onClick={(e) => { e.stopPropagation(); onFav(); }} />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-3 lg:p-4">
        <button onClick={onOpen} className="text-left">
          <h3
            className={`font-bold leading-snug text-slate-800 transition-colors group-hover:text-teal-700 ${
              wide
                ? "line-clamp-2 text-[14px] lg:text-[15px]"
                : "line-clamp-2 text-[13px] lg:text-[14px]"
            }`}
          >
            {p.name}
          </h3>
        </button>

        {wide && (
          <>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">
              {p.description}
            </p>
            <div className="mt-1.5">
              <StockPill ok={p.inStock} />
            </div>
          </>
        )}

        <div className={`mt-auto ${wide ? "flex items-end gap-3 pt-3" : "pt-3"}`}>
          <div className={wide ? "flex-1" : ""}>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
              <OldPrice p={p} />
              <span className="text-[18px] font-black tracking-tight text-slate-900 lg:text-[20px]">
                {money(p.price)}
              </span>
              <span className="text-[13px] font-black text-slate-900">₽</span>
              {p.unit === "м" && (
                <span className="text-[10.5px] font-bold text-slate-400">/м</span>
              )}
            </div>
            {p.unit === "м" && minMeters(p) > 1 && (
              <div className="text-[10px] font-bold text-amber-600">
                от {minMeters(p)} м
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            disabled={!p.inStock}
            className={`rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 font-black text-white shadow-lg shadow-orange-500/25 transition disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:shadow-none ${
              wide ? "px-5 py-2.5 text-[13px]" : "mt-2.5 w-full py-2.5 text-[12.5px]"
            }`}
          >
            {!p.inStock
              ? "Нет"
              : inCart
              ? p.unit === "м"
                ? `${inCart.meters} м · +${minMeters(p)}`
                : `В корзине · ${inCart.quantity}`
              : "В корзину"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= Блок доставки ================= */
function DeliveryInfo({ mediaItems }: { mediaItems: MediaItem[] }) {
  // Берём изображение только из медиа-библиотеки админ-панели.
  // Ищем по имени файла, чтобы не подставлять случайный логотип/баннер.
  const deliveryMedia = mediaItems.find((it) => {
    const n = it.name.toLowerCase();
    return (
      n.includes("car") ||
      n.includes("машин") ||
      n.includes("авто") ||
      n.includes("достав") ||
      n.includes("delivery") ||
      n.includes("yandex") ||
      n.includes("яндекс") ||
      n.includes("box") ||
      n.includes("короб")
    );
  });
  const carSrc = deliveryMedia?.dataUrl;

  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_24px_rgba(15,60,70,0.07)] ring-1 ring-slate-100">
      <div className="relative p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-black leading-tight tracking-tight text-slate-900 lg:text-[17px]">
              Быстрая доставка по городу — от 30 мин.
            </h4>
            <p className="mt-1 text-[12.5px] font-medium leading-snug text-slate-500">
              с помощью «Яндекс Доставка»
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff2d2d] to-[#ff8a1f] px-3.5 py-1.5 text-[12px] font-black text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]">
              <span className="font-black">от 200 ₽</span>
            </div>
          </div>
          {carSrc && (
            <div className="relative h-[92px] w-[140px] shrink-0 translate-x-3 -translate-y-3 lg:h-[118px] lg:w-[180px]">
              <img
                src={carSrc}
                alt="Доставка"
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3C8.13 3 5 5.5 5 9c0 4.5 7 11 7 11s7-6.5 7-11c0-3.5-3.13-6-7-6zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-black leading-tight text-slate-900 lg:text-[15px]">
              Самовывоз <span className="underline decoration-slate-300 decoration-2 underline-offset-4">сегодня</span> до 20:00
            </div>
            <div className="mt-1 text-[12.5px] font-medium leading-snug text-slate-500">
              по адресу Луга, пр. Кирова, д. 80
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Мини-карточка каруселей ================= */
function MiniCard({
  p,
  onOpen,
  onAdd,
  badge,
}: {
  p: Product;
  onOpen: () => void;
  onAdd: () => void;
  badge?: { text: string; cls: string };
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group flex w-[150px] shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_2px_14px_rgba(15,60,70,0.06)] ring-1 ring-slate-100 transition-shadow hover:shadow-[0_10px_32px_rgba(15,60,70,0.12)] lg:w-[190px]"
    >
      <button
        onClick={onOpen}
        className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <img
          src={thumbOf(p)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {discountPercent(p) !== null ? <DiscountBadge p={p} /> : null}
        {badge && (
          <span
            className={`absolute bottom-2 right-2 rounded-lg px-2 py-0.5 text-[9.5px] font-black uppercase text-white shadow-sm ${badge.cls}`}
          >
            {badge.text}
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-2.5 lg:p-3">
        <button onClick={onOpen} className="min-h-[34px] text-left lg:min-h-[38px]">
          <p className="line-clamp-2 text-[12px] font-bold leading-snug text-slate-800 lg:text-[13px]">
            {p.name}
          </p>
        </button>
        <div className="mt-auto pt-2">
          <OldPrice p={p} />
          <div className="flex items-center justify-between gap-1">
          <span className="text-[14px] font-black text-slate-900 lg:text-[15px]">
            {money(p.price)} ₽
          </span>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onAdd}
            disabled={!p.inStock}
            className="rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 p-2 text-white shadow-md shadow-orange-500/25 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-300 disabled:shadow-none"
          >
            <Plus size={14} strokeWidth={3} />
          </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= Имиджевые баннеры ================= */
function TrustBanners() {
  const banners = [
    {
      title: "Мы дорожим своим именем",
      text: "«Водяной» — не безликий гипермаркет. Помогаем подобрать решение и отвечаем за каждую рекомендацию.",
      image: "/images/banner-reputation.png",
      large: true,
      accent: "from-teal-50/90 via-white/90 to-white/60",
      eyebrow: "Забота о покупателе",
    },
    {
      title: "Гарантия производителя",
      text: "Официальная гарантия на технические изделия. Сертификаты и документы на продукцию.",
      image: "/images/banner-warranty.png",
      large: false,
      accent: "from-sky-50/90 via-white/90 to-white/55",
      eyebrow: "Надёжная покупка",
    },
    {
      title: "Возврат и обмен",
      text: "Работаем по закону о защите прав потребителей и всегда стараемся найти удобное решение.",
      image: "/images/banner-returns.png",
      large: false,
      accent: "from-orange-50/90 via-white/90 to-white/55",
      eyebrow: "Без лишних сложностей",
    },
  ];

  return (
    <section className="mb-6 lg:mb-10">
      <div className="mb-3 px-1 lg:mb-4">
        <h2 className="text-[18px] font-black tracking-tight text-slate-900 lg:text-[24px]">
          Почему выбирают «Водяной»
        </h2>
        <p className="mt-1 text-[11.5px] font-medium text-slate-400 lg:text-[13px]">
          Не только продаём сантехнику, но и остаёмся рядом после покупки
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-2 lg:gap-4">
        {banners.map((b, i) => (
          <motion.article
            key={b.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            whileHover={{ y: -4 }}
            className={`group relative isolate min-h-[250px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_4px_24px_rgba(15,60,70,0.07)] ring-1 ring-slate-100 transition-shadow hover:shadow-[0_18px_55px_rgba(15,60,70,0.14)] lg:min-h-0 ${
              b.large
                ? "lg:col-span-7 lg:row-span-2 lg:min-h-[510px]"
                : "lg:col-span-5 lg:min-h-[247px]"
            }`}
          >
            <img
              src={b.image}
              alt=""
              className={`absolute bottom-0 right-0 z-[-2] object-contain transition-transform duration-700 group-hover:scale-105 ${
                b.large
                  ? "h-[72%] w-[80%] translate-x-[8%] translate-y-[3%] lg:h-[74%] lg:w-[78%]"
                  : "h-[68%] w-[64%] translate-x-[5%] translate-y-[2%] lg:h-[78%] lg:w-[58%]"
              }`}
            />

            {/* Мягкий слой оставляет тексту чистую область и растворяется к изображению */}
            <div
              className={`absolute inset-0 z-[-1] bg-gradient-to-r ${b.accent}`}
            />
            <div className="absolute inset-x-0 bottom-0 z-[-1] h-24 bg-gradient-to-t from-white/55 to-transparent" />

            <div
              className={`relative p-5 lg:p-7 ${
                b.large ? "max-w-[90%] lg:max-w-[78%]" : "max-w-[88%] lg:max-w-[70%]"
              }`}
            >
              <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.12em] text-teal-700 shadow-sm ring-1 ring-teal-100/60 backdrop-blur-sm lg:text-[10.5px]">
                {b.eyebrow}
              </span>
              <h3
                className={`mt-2.5 font-black leading-[1.05] tracking-tight text-slate-950 ${
                  b.large
                    ? "text-[26px] lg:text-[42px]"
                    : "text-[23px] lg:text-[28px]"
                }`}
              >
                {b.title}
              </h3>
              <p
                className={`mt-2.5 leading-relaxed text-slate-600 ${
                  b.large
                    ? "max-w-xl text-[13px] lg:text-[17px]"
                    : "max-w-md text-[12px] lg:text-[13.5px]"
                }`}
              >
                {b.text}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ================= Детальная карточка ================= */
function ProductSheet({
  p,
  onClose,
  onAdd,
  inCart,
  categoryLabel,
  related,
  onOpenRelated,
  mediaItems,
  fav,
  onFav,
}: {
  p: Product;
  onClose: () => void;
  onAdd: (times: number) => void;
  inCart?: ShopCartItem;
  categoryLabel: string;
  related: Product[];
  onOpenRelated: (p: Product) => void;
  mediaItems: MediaItem[];
  fav: boolean;
  onFav: () => void;
}) {
  const images = p.gallery?.length ? p.gallery : [thumbOf(p)];
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const step = minMeters(p);
  const isM = p.unit === "м";

  useEffect(() => {
    setIdx(0);
    setQty(1);
  }, [p.id]);

  const total = isM ? p.price * step * qty : p.price * qty;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-40 hidden bg-slate-900/40 backdrop-blur-sm lg:block"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.6 }}
        transition={{ type: "spring", damping: 34, stiffness: 320 }}
        className="absolute inset-0 z-50 flex flex-col bg-white lg:inset-8 lg:overflow-hidden lg:rounded-[2rem] lg:shadow-2xl"
      >
        {/* header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5 lg:px-6 lg:py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 transition active:scale-90 hover:bg-slate-200"
          >
            <ArrowLeft size={19} />
          </button>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-black text-slate-600 lg:text-[15px]">
            {categoryLabel}
          </span>
          <FavBtn active={fav} onClick={onFav} size={17} />
          <button
            onClick={onClose}
            className="hidden rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 lg:block"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-32 lg:flex-row lg:gap-8 lg:overflow-hidden lg:p-8 lg:pb-8">
          {/* галерея */}
          <div
            className={`lg:grid lg:h-full lg:min-h-0 lg:w-[46%] lg:gap-3 ${
              images.length > 1
                ? "lg:grid-rows-[minmax(0,1fr)_96px]"
                : "lg:grid-rows-[minmax(0,1fr)]"
            }`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 lg:min-h-0 lg:flex-1 lg:aspect-auto lg:rounded-3xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={idx}
                  src={images[idx]}
                  alt=""
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full w-full object-contain p-2 lg:p-4"
                />
              </AnimatePresence>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur-sm transition active:scale-90"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIdx((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur-sm transition active:scale-90"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <span className="absolute right-3 top-3 rounded-full bg-slate-900/60 px-2.5 py-1 font-mono text-[10.5px] font-bold text-white backdrop-blur-sm">
                    {idx + 1}/{images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex h-[88px] shrink-0 items-center gap-2 overflow-x-auto overflow-y-hidden px-3 py-2 lg:h-24 lg:px-1 lg:py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition lg:h-20 lg:w-20 ${
                      i === idx
                        ? "border-teal-500 shadow-[0_0_0_2px_rgba(20,184,166,0.12)]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-contain p-1.5"
                    />
                    {i === idx && (
                      <span className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-teal-300/70" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* инфо */}
          <div className="px-4 py-4 lg:flex-1 lg:overflow-y-auto lg:px-0 lg:py-0">
            <h1 className="text-[20px] font-black leading-snug text-slate-900 lg:text-[26px]">
              {p.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {discountPercent(p) !== null && (
                <span className="rounded-lg bg-gradient-to-br from-rose-500 to-red-500 px-2.5 py-1 text-[12px] font-black text-white shadow-md shadow-rose-500/30 lg:text-[13px]">
                  −{discountPercent(p)}%
                </span>
              )}
              <OldPrice p={p} size="lg" />
              <span className="text-[28px] font-black tracking-tight text-slate-900 lg:text-[36px]">
                {money(p.price)} ₽
              </span>
              {isM && (
                <span className="text-[12px] font-bold text-slate-400">за метр</span>
              )}
              <span className="ml-auto">
                <StockPill ok={p.inStock} lg />
              </span>
            </div>

            {isM && step > 1 && (
              <p className="mt-1.5 text-[12px] font-bold text-amber-600">
                Минимальный отрез: {step} м
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { i: Truck, t: "Доставка", s: "от 300 ₽" },
                { i: ShieldCheck, t: "Гарантия", s: "12 мес" },
                { i: Wallet, t: "Оплата", s: "при получении" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-50 p-2.5 text-center transition hover:bg-teal-50"
                >
                  <b.i size={16} className="mx-auto text-teal-600" />
                  <div className="mt-1 text-[10.5px] font-black text-slate-700">{b.t}</div>
                  <div className="text-[9.5px] font-medium text-slate-400">{b.s}</div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600 lg:text-[14.5px]">
              {p.description}
            </p>

            {p.characteristics && p.characteristics.length > 0 && (
              <div className="mt-5">
                <h2 className="mb-2 text-[12px] font-black uppercase tracking-wider text-slate-400">
                  Характеристики
                </h2>
                <div className="overflow-hidden rounded-2xl bg-slate-50">
                  {p.characteristics.map((ch, i) => (
                    <div
                      key={i}
                      className="flex gap-2 border-b border-white px-3.5 py-2.5 last:border-0"
                    >
                      <span className="flex-1 text-[12.5px] font-bold text-slate-400">
                        {ch.name}
                      </span>
                      <span className="text-right text-[12.5px] font-black text-slate-700">
                        {ch.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DeliveryInfo mediaItems={mediaItems} />

            <div className="mt-4 inline-block rounded-xl bg-slate-50 px-3 py-1.5 font-mono text-[11px] text-slate-400">
              Артикул: {p.code}
            </div>

            {/* десктоп: покупка внутри колонки */}
            <div className="mt-6 hidden lg:block">
              {p.inStock && (
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="rounded-xl bg-white p-2 text-slate-600 shadow-sm transition active:scale-90"
                    >
                      <Minus size={15} strokeWidth={3} />
                    </button>
                    <span className="min-w-[60px] text-center text-[14px] font-black text-slate-800">
                      {isM ? `${step * qty} м` : `${qty} шт`}
                    </span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="rounded-xl bg-teal-500 p-2 text-white shadow-sm transition active:scale-90"
                    >
                      <Plus size={15} strokeWidth={3} />
                    </button>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold text-slate-400">Итого</div>
                    <div className="text-[22px] font-black text-slate-900">
                      {money(total)} ₽
                    </div>
                  </div>
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(qty)}
                disabled={!p.inStock}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 py-4 text-[16px] font-black text-white shadow-xl shadow-orange-500/30 transition disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:shadow-none"
              >
                {!p.inStock ? "Нет в наличии" : inCart ? "Добавить ещё" : "Добавить в корзину"}
              </motion.button>
            </div>

            {related.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2.5 text-[14px] font-black text-slate-800">
                  Похожие товары
                </h2>
                <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenRelated(r)}
                      className="group w-[128px] shrink-0 overflow-hidden rounded-2xl bg-slate-50 text-left transition hover:bg-slate-100"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-white">
                        <img
                          src={thumbOf(r)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-[11px] font-bold leading-snug text-slate-700">
                          {r.name}
                        </p>
                        <p className="mt-1 text-[12.5px] font-black text-slate-900">
                          {money(r.price)} ₽
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* мобильная панель покупки */}
        <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-md lg:hidden">
          {p.inStock && (
            <div className="mb-2 flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm active:scale-90"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="min-w-[46px] text-center text-[13px] font-black text-slate-800">
                  {isM ? `${step * qty} м` : `${qty} шт`}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="rounded-lg bg-teal-500 p-1.5 text-white shadow-sm active:scale-90"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] font-bold text-slate-400">Итого</div>
                <div className="text-[17px] font-black text-slate-900">
                  {money(total)} ₽
                </div>
              </div>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onAdd(qty)}
            disabled={!p.inStock}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 py-3.5 text-[15px] font-black text-white shadow-lg shadow-orange-500/25 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            {!p.inStock ? "Нет в наличии" : inCart ? "Добавить ещё" : "Добавить в корзину"}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ================= ВИТРИНА ================= */
export default function ShopView({
  products,
  categories,
  cart,
  onAdd,
  onOpenCart,
  onOpenMenu,
  totalCount,
  loading,
  logoUrl,
  mediaItems,
}: {
  products: Product[];
  categories: Category[];
  cart: ShopCartItem[];
  onAdd: (p: Product) => void;
  onOpenCart: () => void;
  onOpenMenu: () => void;
  totalCount: number;
  loading: boolean;
  logoUrl: string;
  mediaItems: MediaItem[];
}) {
  const [tab, setTab] = useState<"home" | "catalog" | "fav">("home");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string>("all");
  const [detail, setDetail] = useState<Product | null>(null);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sort, setSort] = useState<"default" | "asc" | "desc">("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [listView, setListView] = useState(false);
  const [promo, setPromo] = useState(0);
  const [toast, setToast] = useState("");

  const [favs, setFavs] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [recent, setRecent] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const toggleFav = (id: number) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      setToast(prev.includes(id) ? "Убрано из избранного" : "♥ В избранном");
      return next;
    });
  };

  const openDetail = (p: Product) => {
    setDetail(p);
    setRecent((prev) => {
      const next = [p.id, ...prev.filter((x) => x !== p.id)].slice(0, 12);
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const priceCeil = useMemo(
    () => Math.max(1000, ...products.map((p) => p.price)),
    [products]
  );

  const promos = useMemo(
    () => [
      {
        t: "Сантехника,\nкоторая служит",
        s: "Трубы, фитинги, краны и насосы — всё в наличии",
        cta: "Смотреть каталог",
        act: () => setTab("catalog"),
        g: "from-[#0b2b45] via-[#0f5e63] to-[#14b8a6]",
        icon: Droplets,
      },
      {
        t: "Скидка 5%\nпо карте клуба",
        s: "Копите чеки от 25 000 ₽ и экономьте на каждом заказе",
        cta: "Получить карту",
        act: onOpenMenu,
        g: "from-[#7c2d12] via-[#ea580c] to-[#f59e0b]",
        icon: Award,
      },
      {
        t: "Подберём насос\nза 30 секунд",
        s: "Рассчитаем мощность и подберём нужную модель",
        cta: "Подобрать насос",
        act: onOpenMenu,
        g: "from-[#0c4a6e] via-[#0891b2] to-[#22d3ee]",
        icon: Zap,
      },
    ],
    [onOpenMenu]
  );

  const promoRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      promoRef.current = (promoRef.current + 1) % promos.length;
      setPromo(promoRef.current);
    }, 5500);
    return () => clearInterval(t);
  }, [promos.length]);

  const q = query.trim().toLowerCase();
  const catObj = activeCat ? categories.find((c) => c.key === activeCat) ?? null : null;
  const subs = catObj?.subcategories ?? [];
  const subObj = activeSub !== "all" ? subs.find((s) => s.key === activeSub) : null;

  const list = useMemo(() => {
    let res = products;
    if (q) {
      res = res.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    } else if (activeCat) {
      res = res.filter((p) => catKeyOf(p) === activeCat);
      if (subObj) res = res.filter((p) => matchSub(p, subObj));
    }
    if (onlyInStock) res = res.filter((p) => p.inStock);
    if (maxPrice !== null) res = res.filter((p) => p.price <= maxPrice);
    if (sort === "asc") res = [...res].sort((a, b) => a.price - b.price);
    if (sort === "desc") res = [...res].sort((a, b) => b.price - a.price);
    return res;
  }, [products, q, activeCat, subObj, onlyInStock, sort, maxPrice]);

  const cartOf = (id: number) => cart.find((c) => c.product.id === id);
  const byId = (id: number) => products.find((p) => p.id === id);
  const countIn = (key: string) => products.filter((p) => catKeyOf(p) === key).length;

  const hits = useMemo(() => products.filter((p) => p.inStock).slice(0, 12), [products]);
  const fresh = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 12), [products]);
  const favProducts = favs.map(byId).filter(Boolean) as Product[];
  const recentProducts = recent.map(byId).filter(Boolean) as Product[];

  const relatedFor = (p: Product) =>
    products.filter((x) => x.id !== p.id && catKeyOf(x) === catKeyOf(p)).slice(0, 8);

  const filtersActive = onlyInStock || sort !== "default" || maxPrice !== null;
  const searching = q.length > 0;
  const cartSum = cart.reduce((s, i) => s + itemTotal(i), 0);

  const addWithToast = (p: Product, times = 1) => {
    for (let i = 0; i < times; i++) onAdd(p);
    setToast(p.unit === "м" ? `Добавлено ${minMeters(p) * times} м` : "Добавлено в корзину");
  };

  const gotoCategory = (key: string) => {
    setActiveCat(key);
    setActiveSub("all");
    setTab("catalog");
    setQuery("");
  };

  /* ---------- карусель ---------- */
  const Carousel = ({
    title,
    subtitle,
    icon: Icon,
    items,
    badge,
  }: {
    title: string;
    subtitle?: string;
    icon: typeof Flame;
    items: Product[];
    badge?: { text: string; cls: string };
  }) =>
    items.length === 0 ? null : (
      <section className="mb-6 lg:mb-10">
        <div className="mb-3 flex items-end gap-2 px-1">
          <div className="rounded-xl bg-teal-50 p-1.5">
            <Icon size={16} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-[16px] font-black leading-none text-slate-900 lg:text-[20px]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[11px] font-medium text-slate-400 lg:text-[12.5px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((p) => (
            <MiniCard
              key={p.id}
              p={p}
              badge={badge}
              onOpen={() => openDetail(p)}
              onAdd={() => addWithToast(p)}
            />
          ))}
        </div>
      </section>
    );

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-b from-[#f6fafb] to-[#eef5f7]">
      {/* ============ ШАПКА ============ */}
      <header className="z-20 shrink-0 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center gap-2 px-3 py-2.5 lg:gap-5 lg:px-8 lg:py-4">
            <button
              onClick={() => {
                setTab("home");
                setActiveCat(null);
                setQuery("");
              }}
              className="flex shrink-0 items-center gap-2.5 active:scale-95"
            >
              <img src={logoUrl} alt="" className="h-10 w-10 object-contain lg:h-14 lg:w-14" />
              <div className="text-left">
                <div className="text-[16px] font-black leading-none tracking-tight text-[#0b2b45] lg:text-[22px]">
                  Водяной
                </div>
                <div className="mt-0.5 text-[9.5px] font-bold text-slate-400 lg:text-[11.5px]">
                  Магазин сантехники
                </div>
              </div>
            </button>

            {/* десктоп-навигация */}
            <nav className="ml-6 hidden items-center gap-1 lg:flex">
              {[
                { k: "home" as const, l: "Главная" },
                { k: "catalog" as const, l: "Каталог" },
                { k: "fav" as const, l: "Избранное" },
              ].map((t) => (
                <button
                  key={t.k}
                  onClick={() => {
                    setTab(t.k);
                    setQuery("");
                  }}
                  className={`rounded-xl px-4 py-2 text-[13.5px] font-black transition ${
                    tab === t.k
                      ? "bg-[#0b2b45] text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {t.l}
                  {t.k === "fav" && favs.length > 0 && (
                    <span className="ml-1.5 text-rose-400">{favs.length}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* поиск на десктопе */}
            <div className="relative ml-auto hidden max-w-md flex-1 lg:block">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value) setTab("catalog");
                }}
                placeholder="Поиск товара или артикула"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-9 text-[14px] font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 p-1 text-slate-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
              <button
                onClick={onOpenMenu}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 transition active:scale-90 hover:bg-slate-200 lg:px-3.5 lg:py-2.5"
              >
                <span className="flex items-center gap-1.5">
                  <MenuIcon size={18} strokeWidth={2.2} />
                  <span className="hidden text-[13px] font-black lg:inline">Меню</span>
                </span>
              </button>
              <button
                onClick={onOpenCart}
                className="relative hidden items-center gap-2 rounded-xl bg-[#0b2b45] px-4 py-2.5 text-white transition active:scale-95 hover:bg-[#123a5c] lg:flex"
              >
                <ShoppingCart size={18} strokeWidth={2.2} />
                <span className="text-[13px] font-black">
                  {totalCount > 0 ? `${money(cartSum)} ₽` : "Корзина"}
                </span>
                {totalCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black">
                    {totalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* мобильный поиск */}
          <div className="flex gap-2 px-3 pb-2.5 lg:hidden">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value) setTab("catalog");
                }}
                placeholder="Поиск товара или артикула"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-[13.5px] font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 p-0.5 text-slate-500"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {tab === "catalog" && (
              <>
                <button
                  onClick={() => setListView((v) => !v)}
                  className="shrink-0 rounded-2xl bg-slate-100 px-3 text-slate-500 active:scale-95"
                >
                  {listView ? <LayoutGrid size={16} /> : <Rows3 size={16} />}
                </button>
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`shrink-0 rounded-2xl px-3 transition active:scale-95 ${
                    filtersActive ? "bg-[#0b2b45] text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <SlidersHorizontal size={16} />
                </button>
              </>
            )}
          </div>

          {/* мобильные фильтры */}
          <AnimatePresence initial={false}>
            {filtersOpen && tab === "catalog" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden lg:hidden"
              >
                <div className="space-y-2.5 border-t border-slate-100 px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setOnlyInStock((v) => !v)}
                      className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold transition active:scale-95 ${
                        onlyInStock ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Только в наличии
                    </button>
                    {[
                      { k: "default" as const, l: "Без сортировки" },
                      { k: "asc" as const, l: "Дешевле" },
                      { k: "desc" as const, l: "Дороже" },
                    ].map((s) => (
                      <button
                        key={s.k}
                        onClick={() => setSort(s.k)}
                        className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold transition active:scale-95 ${
                          sort === s.k ? "bg-[#0b2b45] text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {s.l}
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Цена до</span>
                      <span className="text-teal-700">
                        {maxPrice === null ? "любая" : `${money(maxPrice)} ₽`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={priceCeil}
                      step={100}
                      value={maxPrice ?? priceCeil}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxPrice(v >= priceCeil ? null : v);
                      }}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
                    />
                  </div>
                  {filtersActive && (
                    <button
                      onClick={() => {
                        setOnlyInStock(false);
                        setSort("default");
                        setMaxPrice(null);
                      }}
                      className="w-full rounded-xl bg-slate-100 py-2 text-[12px] font-black text-slate-500"
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* подкатегории (мобайл) */}
          {tab === "catalog" && !searching && activeCat && subs.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveSub("all")}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold transition ${
                  activeSub === "all" ? "bg-[#0b2b45] text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                Все
              </button>
              {subs.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveSub(s.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-bold transition ${
                    activeSub === s.key ? "bg-[#0b2b45] text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.img && (
                    <img
                      src={s.img}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover ring-1 ring-white/60"
                    />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ============ КОНТЕНТ ============ */}
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-8">
        <div className="mx-auto max-w-[1400px] px-3 pt-3 lg:px-8 lg:pt-6">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="aspect-square w-full animate-pulse bg-slate-200/70" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 animate-pulse rounded bg-slate-200/70" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200/70" />
                    <div className="h-9 animate-pulse rounded-2xl bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "home" ? (
            <>
              {/* ===== HERO ===== */}
              <section className="relative mb-6 overflow-hidden rounded-3xl shadow-2xl shadow-teal-900/15 lg:mb-10 lg:rounded-[2rem]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={promo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`relative bg-gradient-to-br ${promos[promo].g}`}
                  >
                    {/* декоративные круги */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl lg:h-96 lg:w-96" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl lg:h-80 lg:w-80" />

                    <div className="relative flex items-center gap-4 p-5 lg:p-14">
                      <div className="min-w-0 flex-1">
                        <motion.div
                          initial={{ y: 16, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm lg:text-[12px]"
                        >
                          <Sparkles size={12} /> Магазин «Водяной»
                        </motion.div>
                        <motion.h1
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="mt-2.5 whitespace-pre-line text-[26px] font-black leading-[1.05] tracking-tight text-white lg:text-[56px]"
                        >
                          {promos[promo].t}
                        </motion.h1>
                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.22 }}
                          className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-white/85 lg:mt-4 lg:text-[17px]"
                        >
                          {promos[promo].s}
                        </motion.p>
                        <motion.button
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.28 }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={promos[promo].act}
                          className={`mt-4 items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-[13px] font-black text-slate-900 shadow-xl lg:mt-7 lg:px-8 lg:py-4 lg:text-[15px] ${
                            promos[promo].cta === "Спросить бота" ? "hidden lg:inline-flex" : "inline-flex"
                          }`}
                        >
                          {promos[promo].cta} <ArrowRight size={15} />
                        </motion.button>
                      </div>

                      {/* иконка справа */}
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", damping: 16 }}
                        className="hidden shrink-0 rounded-[2rem] bg-white/10 p-8 backdrop-blur-sm lg:block"
                      >
                        {(() => {
                          const I = promos[promo].icon;
                          return <I size={110} className="text-white/85" strokeWidth={1.2} />;
                        })()}
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-4 right-4 flex gap-1.5 lg:bottom-7 lg:right-8">
                  {promos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        promoRef.current = i;
                        setPromo(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === promo ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </section>

              {/* ===== Категории плитками ===== */}
              <section className="mb-6 lg:mb-10">
                <h2 className="mb-3 px-1 text-[16px] font-black text-slate-900 lg:text-[22px]">
                  Категории товаров
                </h2>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 lg:gap-4">
                  {categories.map((c, i) => (
                    <motion.button
                      key={c.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -6 }}
                      onClick={() => gotoCategory(c.key)}
                      className="group overflow-hidden rounded-3xl bg-white shadow-[0_2px_14px_rgba(15,60,70,0.06)] ring-1 ring-slate-100 transition-shadow hover:shadow-[0_14px_40px_rgba(15,60,70,0.14)]"
                    >
                      <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-50">
                        <img
                          src={c.img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-2 lg:p-3">
                        <div className="line-clamp-2 text-[11px] font-black leading-tight text-slate-800 lg:text-[13.5px]">
                          {c.label}
                        </div>
                        <div className="mt-0.5 text-[9.5px] font-bold text-slate-400 lg:text-[11px]">
                          {countIn(c.key)} товаров
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>

              <Carousel
                title="Хиты продаж"
                subtitle="Что покупают чаще всего"
                icon={Flame}
                items={hits}
                badge={{ text: "хит", cls: "bg-orange-500" }}
              />
              <Carousel
                title="Новинки"
                subtitle="Свежие поступления на склад"
                icon={Sparkles}
                items={fresh}
                badge={{ text: "new", cls: "bg-teal-600" }}
              />
              {recentProducts.length > 0 && (
                <Carousel title="Вы смотрели" icon={Clock} items={recentProducts} />
              )}

              <TrustBanners />

              {/* ===== Преимущества ===== */}
              <section className="mb-6 grid grid-cols-2 gap-2.5 lg:mb-10 lg:grid-cols-4 lg:gap-4">
                {[
                  { i: Truck, t: "Быстрая доставка", s: "По городу от 300 ₽, самовывоз бесплатно" },
                  { i: ShieldCheck, t: "Гарантия 12 мес", s: "На весь ассортимент магазина" },
                  { i: Award, t: "Проверенные мастера", s: "Монтаж под ключ с гарантией" },
                  { i: Wallet, t: "Скидка 5%", s: "Постоянным клиентам по карте" },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-3xl bg-white p-4 shadow-[0_2px_14px_rgba(15,60,70,0.05)] ring-1 ring-slate-100 lg:p-6"
                  >
                    <div className="inline-flex rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 shadow-lg shadow-teal-500/25">
                      <b.i size={18} className="text-white" />
                    </div>
                    <div className="mt-2.5 text-[13px] font-black text-slate-900 lg:text-[15px]">
                      {b.t}
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed text-slate-400 lg:text-[12.5px]">
                      {b.s}
                    </div>
                  </motion.div>
                ))}
              </section>

              {/* ===== CTA чат-бот ===== */}
              <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b2b45] to-[#0f5e63] p-5 shadow-xl lg:mb-10 lg:flex lg:items-center lg:gap-8 lg:p-10">
                <div className="flex-1">
                  <h3 className="text-[18px] font-black leading-tight text-white lg:text-[26px]">
                    Не знаете, что выбрать?
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75 lg:text-[15px]">
                    Спросите чат-бота — подберём товар, рассчитаем насос и подскажем
                    по монтажу
                  </p>
                </div>
                <div className="mt-4 flex gap-2 lg:mt-0 lg:shrink-0">
                  <a
                    href="tel:+79001234567"
                    className="flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-[13px] font-black text-white backdrop-blur-sm transition active:scale-95 lg:text-[15px]"
                  >
                    <Phone size={16} /> Позвонить
                  </a>
                </div>
              </section>
            </>
          ) : tab === "fav" ? (
            favProducts.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-slate-400">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <Heart size={40} className="opacity-30" />
                </div>
                <p className="mt-4 text-[15px] font-black text-slate-500">
                  В избранном пусто
                </p>
                <p className="mt-1 text-[12.5px]">Нажимайте ♥ на карточках товаров</p>
                <button
                  onClick={() => setTab("catalog")}
                  className="mt-5 rounded-2xl bg-[#0b2b45] px-6 py-3 text-[13px] font-black text-white shadow-lg active:scale-95"
                >
                  Перейти в каталог
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-3 px-1 text-[16px] font-black text-slate-900 lg:text-[22px]">
                  Избранное · {favProducts.length}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
                  {favProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      p={p}
                      inCart={cartOf(p.id)}
                      fav
                      onFav={() => toggleFav(p.id)}
                      onOpen={() => openDetail(p)}
                      onAdd={() => addWithToast(p)}
                    />
                  ))}
                </div>
              </>
            )
          ) : (
            /* ===== КАТАЛОГ ===== */
            <div className="lg:flex lg:gap-8">
              {/* десктоп-сайдбар */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-4 space-y-4">
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-2.5 text-[12px] font-black uppercase tracking-wider text-slate-400">
                      Категории
                    </h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setActiveCat(null);
                          setActiveSub("all");
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-bold transition ${
                          !activeCat
                            ? "bg-[#0b2b45] text-white"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Все товары
                        <span className="text-[11px] opacity-60">{products.length}</span>
                      </button>
                      {categories.map((c) => (
                        <div key={c.key}>
                          <button
                            onClick={() => {
                              setActiveCat(c.key);
                              setActiveSub("all");
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-bold transition ${
                              activeCat === c.key
                                ? "bg-teal-50 text-teal-700"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{c.label}</span>
                            <span className="text-[11px] opacity-60">
                              {countIn(c.key)}
                            </span>
                          </button>
                          {activeCat === c.key && c.subcategories?.length ? (
                            <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-teal-100 pl-2">
                              <button
                                onClick={() => setActiveSub("all")}
                                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] font-bold transition ${
                                  activeSub === "all"
                                    ? "bg-teal-500 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                Все
                              </button>
                              {c.subcategories.map((s) => (
                                <button
                                  key={s.key}
                                  onClick={() => setActiveSub(s.key)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] font-bold transition ${
                                    activeSub === s.key
                                      ? "bg-teal-500 text-white"
                                      : "text-slate-500 hover:bg-slate-50"
                                  }`}
                                >
                                  {s.img && (
                                    <img
                                      src={s.img}
                                      alt=""
                                      className="h-5 w-5 rounded-md object-cover ring-1 ring-white/50"
                                    />
                                  )}
                                  <span className="min-w-0 flex-1 truncate">
                                    {s.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* фильтры десктоп */}
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <h3 className="mb-2.5 text-[12px] font-black uppercase tracking-wider text-slate-400">
                      Фильтры
                    </h3>
                    <button
                      onClick={() => setOnlyInStock((v) => !v)}
                      className={`mb-3 w-full rounded-xl px-3 py-2 text-[12.5px] font-bold transition ${
                        onlyInStock
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Только в наличии
                    </button>
                    <div className="mb-1 flex items-center justify-between text-[11.5px] font-bold">
                      <span className="text-slate-500">Цена до</span>
                      <span className="text-teal-700">
                        {maxPrice === null ? "любая" : `${money(maxPrice)} ₽`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={priceCeil}
                      step={100}
                      value={maxPrice ?? priceCeil}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setMaxPrice(v >= priceCeil ? null : v);
                      }}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
                    />
                    <div className="mt-3 space-y-1">
                      {[
                        { k: "default" as const, l: "Без сортировки" },
                        { k: "asc" as const, l: "Сначала дешевле" },
                        { k: "desc" as const, l: "Сначала дороже" },
                      ].map((s) => (
                        <button
                          key={s.k}
                          onClick={() => setSort(s.k)}
                          className={`w-full rounded-xl px-3 py-2 text-left text-[12.5px] font-bold transition ${
                            sort === s.k
                              ? "bg-[#0b2b45] text-white"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {s.l}
                        </button>
                      ))}
                    </div>
                    {filtersActive && (
                      <button
                        onClick={() => {
                          setOnlyInStock(false);
                          setSort("default");
                          setMaxPrice(null);
                        }}
                        className="mt-3 w-full rounded-xl bg-rose-50 py-2 text-[12px] font-black text-rose-500"
                      >
                        Сбросить фильтры
                      </button>
                    )}
                  </div>
                </div>
              </aside>

              {/* сетка товаров */}
              <div className="min-w-0 flex-1">
                {!searching && !activeCat ? (
                  <>
                    <h2 className="mb-3 px-1 text-[16px] font-black text-slate-900 lg:hidden">
                      Категории
                    </h2>
                    <div className="space-y-2 lg:hidden">
                      {categories.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => {
                            setActiveCat(c.key);
                            setActiveSub("all");
                          }}
                          className="flex w-full items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100 active:scale-[0.98]"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50">
                            <img src={c.img} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-[14.5px] font-black text-slate-900">
                              {c.label}
                            </div>
                            <div className="text-[11.5px] font-medium text-slate-400">
                              {countIn(c.key)} товаров
                              {c.subcategories?.length
                                ? ` · ${c.subcategories.length} разделов`
                                : ""}
                            </div>
                          </div>
                          <ChevronRight size={18} className="shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>
                    {/* десктоп — сразу все товары */}
                    <div className="hidden lg:block">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-[22px] font-black text-slate-900">
                          Все товары
                        </h2>
                        <span className="text-[13px] font-bold text-slate-400">
                          {list.length} позиций
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                        {list.map((p) => (
                          <ProductCard
                            key={p.id}
                            p={p}
                            inCart={cartOf(p.id)}
                            fav={favs.includes(p.id)}
                            onFav={() => toggleFav(p.id)}
                            onOpen={() => openDetail(p)}
                            onAdd={() => addWithToast(p)}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {!searching && activeCat && (
                      <button
                        onClick={() => {
                          setActiveCat(null);
                          setActiveSub("all");
                        }}
                        className="mb-3 flex items-center gap-1.5 text-[12.5px] font-black text-teal-700 active:scale-95 lg:hidden"
                      >
                        <ArrowLeft size={14} /> Все категории
                      </button>
                    )}

                    <div className="mb-3 flex items-center justify-between px-1">
                      <h2 className="text-[16px] font-black text-slate-900 lg:text-[22px]">
                        {searching
                          ? "Результаты поиска"
                          : subObj?.label ?? catObj?.label ?? "Товары"}
                      </h2>
                      <span className="text-[12px] font-bold text-slate-400 lg:text-[13px]">
                        {list.length} позиций
                      </span>
                    </div>

                    {list.length === 0 ? (
                      <div className="flex flex-col items-center py-24 text-slate-400">
                        <div className="rounded-3xl bg-white p-6 shadow-sm">
                          <Search size={38} className="opacity-30" />
                        </div>
                        <p className="mt-4 text-[15px] font-black text-slate-500">
                          Ничего не найдено
                        </p>
                        <p className="mt-1 text-[12.5px]">Попробуйте изменить запрос</p>
                      </div>
                    ) : (
                      <div
                        className={
                          listView
                            ? "space-y-3"
                            : "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
                        }
                      >
                        {list.map((p) => (
                          <ProductCard
                            key={p.id}
                            p={p}
                            wide={listView}
                            inCart={cartOf(p.id)}
                            fav={favs.includes(p.id)}
                            onFav={() => toggleFav(p.id)}
                            onOpen={() => openDetail(p)}
                            onAdd={() => addWithToast(p)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* футер (десктоп) */}
        <footer className="mt-10 hidden border-t border-slate-200 bg-white py-8 lg:block">
          <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-8">
            <img src={logoUrl} alt="" className="h-14 w-14 object-contain" />
            <div>
              <div className="text-[17px] font-black text-[#0b2b45]">Водяной</div>
              <div className="text-[12.5px] text-slate-400">
                Сантехника, отопление и водоснабжение
              </div>
            </div>
            <div className="ml-auto flex items-center gap-6 text-[13px] font-bold text-slate-500">
              <a href="tel:+79001234567" className="hover:text-teal-700">
                +7 (900) 123-45-67
              </a>
              <button onClick={onOpenMenu} className="hover:text-teal-700">
                Контакты
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* ============ Мобильная нижняя навигация ============ */}
      <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-stretch">
          {[
            { k: "home" as const, i: Home, l: "Главная" },
            { k: "catalog" as const, i: LayoutGrid, l: "Каталог" },
            { k: "fav" as const, i: Heart, l: "Избранное", n: favs.length },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => {
                setTab(t.k);
                setQuery("");
              }}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition ${
                tab === t.k ? "text-teal-700" : "text-slate-400"
              }`}
            >
              <t.i size={20} strokeWidth={tab === t.k ? 2.7 : 2} />
              <span className="text-[9.5px] font-black">{t.l}</span>
              {tab === t.k && (
                <motion.span
                  layoutId="tabDot"
                  className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-teal-600"
                />
              )}
              {!!t.n && t.n > 0 && (
                <span className="absolute right-[24%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                  {t.n}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={onOpenCart}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-slate-400"
          >
            <ShoppingCart size={20} strokeWidth={2} />
            <span className="text-[9.5px] font-black">Корзина</span>
            {totalCount > 0 && (
              <span className="absolute right-[24%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* плавающая корзина (мобайл) */}
      <AnimatePresence>
        {totalCount > 0 && !detail && (
          <motion.button
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
            onClick={onOpenCart}
            className="absolute inset-x-3 bottom-[62px] z-30 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0b2b45] to-[#0f5e63] px-4 py-3 text-white shadow-2xl shadow-teal-900/30 active:scale-[0.98] lg:hidden"
          >
            <ShoppingCart size={17} />
            <span className="text-[13px] font-black">Оформить · {totalCount}</span>
            <span className="ml-auto text-[15px] font-black">{money(cartSum)} ₽</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* тост */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-[124px] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-2xl bg-slate-900/92 px-5 py-2.5 text-[13px] font-black text-white shadow-2xl backdrop-blur-sm lg:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* детальная карточка */}
      <AnimatePresence>
        {detail && (
          <ProductSheet
            p={detail}
            inCart={cartOf(detail.id)}
            fav={favs.includes(detail.id)}
            onFav={() => toggleFav(detail.id)}
            related={relatedFor(detail)}
            onOpenRelated={(r) => openDetail(r)}
            mediaItems={mediaItems}
            categoryLabel={
              categories.find((c) => c.key === catKeyOf(detail))?.label ?? detail.category
            }
            onAdd={(times) => addWithToast(detail, times)}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
