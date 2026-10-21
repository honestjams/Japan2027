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

export type ChecklistSection =
  | "book"
  | "papers"
  | "money"
  | "tech"
  | "health"
  | "home"
  | "pack"
  | "final";

export interface ChecklistItem {
  id: string;
  title: string;
  section: ChecklistSection;
  notes: string | null;
  due_by: string | null;
  owner: Who;
  done: boolean;
  done_by: Traveller | null;
  done_at: string | null;
  sort_order: number;
  created_at: string;
}

export type ChecklistDraft = Partial<
  Omit<ChecklistItem, "id" | "created_at">
> & {
  id?: string;
};

/** Pre-trip checklist sections, in the order you'd tackle them. */
export const CHECKLIST_SECTIONS: Record<
  ChecklistSection,
  { label: string; kanji: string; color: string }
> = {
  book: { label: "Book it", kanji: "予", color: "var(--cat-stay)" },
  papers: { label: "Papers", kanji: "証", color: "var(--cat-drive)" },
  money: { label: "Money", kanji: "円", color: "var(--cat-drinks)" },
  tech: { label: "Phones & tech", kanji: "電", color: "var(--cat-retro)" },
  health: { label: "Health", kanji: "薬", color: "var(--cat-tea)" },
  home: { label: "Home", kanji: "家", color: "var(--cat-coffee)" },
  pack: { label: "Pack", kanji: "荷", color: "var(--cat-shopping)" },
  final: { label: "Last few days", kanji: "発", color: "var(--tape-red)" },
};

export const CHECKLIST_SECTION_KEYS = Object.keys(
  CHECKLIST_SECTIONS,
) as ChecklistSection[];

/** A booking that covers the nights check_in <= date < check_out. */
export interface Stay {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  address: string | null;
  check_in: string;
  check_out: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "idea" | "booked";
  booking_ref: string | null;
  url: string | null;
  cost_jpy: number | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}

export type StayDraft = Partial<Omit<Stay, "id">> & { id?: string };
