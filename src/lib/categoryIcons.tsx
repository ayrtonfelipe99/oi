import {
  HardHat,
  Eye,
  Ear,
  Wind,
  Shirt,
  Shield,
  Hand,
  Footprints,
  Hammer,
  Zap,
  Package,
  Wrench,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Flame,
  Snowflake,
  Droplet,
  Activity,
  Box,
  Layers,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  HardHat,
  Eye,
  Ear,
  Wind,
  Shirt,
  Shield,
  Hand,
  Footprints,
  Hammer,
  Zap,
  Package,
  Wrench,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Flame,
  Snowflake,
  Droplet,
  Activity,
  Box,
  Layers,
};

export const CATEGORY_ICONS = Object.keys(CATEGORY_ICON_MAP);

export const CATEGORY_COLORS: { key: string; label: string; text: string; bg: string }[] = [
  { key: "blue",    label: "Azul",     text: "text-blue-600",    bg: "bg-blue-50" },
  { key: "indigo",  label: "Índigo",   text: "text-indigo-600",  bg: "bg-indigo-50" },
  { key: "cyan",    label: "Ciano",    text: "text-cyan-600",    bg: "bg-cyan-50" },
  { key: "emerald", label: "Verde",    text: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "lime",    label: "Lima",     text: "text-lime-600",    bg: "bg-lime-50" },
  { key: "amber",   label: "Âmbar",    text: "text-amber-600",   bg: "bg-amber-50" },
  { key: "orange",  label: "Laranja",  text: "text-orange-600",  bg: "bg-orange-50" },
  { key: "rose",    label: "Rosa",     text: "text-rose-600",    bg: "bg-rose-50" },
  { key: "red",     label: "Vermelho", text: "text-red-600",     bg: "bg-red-50" },
  { key: "purple",  label: "Roxo",     text: "text-purple-600",  bg: "bg-purple-50" },
  { key: "teal",    label: "Verde-azulado", text: "text-teal-600", bg: "bg-teal-50" },
  { key: "yellow",  label: "Amarelo",  text: "text-yellow-600",  bg: "bg-yellow-50" },
  { key: "slate",   label: "Cinza",    text: "text-slate-600",   bg: "bg-slate-100" },
];

export const getIconComponent = (name?: string | null): LucideIcon =>
  (name && CATEGORY_ICON_MAP[name]) || Package;

export const getColorClasses = (key?: string | null) => {
  const found = CATEGORY_COLORS.find((c) => c.key === key);
  return { text: found?.text ?? "text-slate-600", bg: found?.bg ?? "bg-slate-100" };
};
