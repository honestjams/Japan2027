export type Category =
  | "food"
  | "coffee"
  | "drinks"
  | "retro"
  | "cars"
  | "drive"
  | "sights"
  | "art"
  | "tea"
  | "nature"
  | "shopping"
  | "transport"
  | "stay"
  | "tip";

export type Status = "idea" | "planned" | "booked" | "done";
export type Slot = "morning" | "afternoon" | "evening" | "night";
export type Who = "josh" | "sam" | "both";
export type Traveller = Exclude<Who, "both">;

export interface TripDay {
  date: string;
  city: string;
  stay: string | null;
  is_drive_day: boolean;
  car: string | null;
  notes: string | null;
}

export interface PlanItem {
  id: string;
  title: string;
  category: Category;
  city: string | null;
  area: string | null;
  date: string | null;
  slot: Slot | null;
  start_time: string | null;
  status: Status;
  wish_of: Who;
  added_by: Traveller | null;
  cost_jpy: number | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  suggestion_id: string | null;
  sort_order: number;
  created_at: string;
}

export type PlanItemDraft = Partial<Omit<PlanItem, "id" | "created_at">> & {
  id?: string;
};

export interface Suggestion {
  id: string;
  for_who: Who;
  title: string;
  category: Category;
  city: string;
  area: string | null;
  description: string;
  cost_hint: string | null;
  tags: string[];
  lat: number | null;
  lng: number | null;
  url: string | null;
}

/** Each category gets a washi-tape colour and a kanji "hanko" stamp. */
export const CATEGORIES: Record<
  Category,
  { label: string; kanji: string; color: string }
> = {
  food: { label: "Food", kanji: "食", color: "var(--cat-food)" },
  coffee: { label: "Coffee", kanji: "珈", color: "var(--cat-coffee)" },
  drinks: { label: "Drinks", kanji: "酒", color: "var(--cat-drinks)" },
  retro: { label: "Retro", kanji: "遊", color: "var(--cat-retro)" },
  cars: { label: "Cars", kanji: "車", color: "var(--cat-cars)" },
  drive: { label: "Drive", kanji: "道", color: "var(--cat-drive)" },
  sights: { label: "Sights", kanji: "景", color: "var(--cat-sights)" },
  art: { label: "Art", kanji: "美", color: "var(--cat-art)" },
  tea: { label: "Tea", kanji: "茶", color: "var(--cat-tea)" },
  nature: { label: "Nature", kanji: "鹿", color: "var(--cat-nature)" },
  shopping: { label: "Shops", kanji: "買", color: "var(--cat-shopping)" },
  transport: { label: "Transit", kanji: "移", color: "var(--cat-transport)" },
  stay: { label: "Stay", kanji: "宿", color: "var(--cat-stay)" },
  tip: { label: "Tip", kanji: "注", color: "var(--cat-tip)" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export const SLOTS: { key: Slot; label: string; vhs: string }[] = [
  { key: "morning", label: "Morning", vhs: "AM" },
  { key: "afternoon", label: "Afternoon", vhs: "PM" },
  { key: "evening", label: "Evening", vhs: "EVE" },
  { key: "night", label: "Night", vhs: "NITE" },
];

export const STATUSES: { key: Status; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "planned", label: "Planned" },
  { key: "booked", label: "Booked" },
  { key: "done", label: "Done" },
];

export const TRAVELLERS: Record<Traveller, { name: string; color: string }> = {
  josh: { name: "Josh", color: "var(--cat-cars)" },
  sam: { name: "Sam", color: "var(--sakura)" },
};

export const CITY_PRESETS = [
  "Tokyo",
  "Yokohama",
  "Hakone / Fuji",
  "Nagoya",
  "Kyoto",
  "Osaka",
];
