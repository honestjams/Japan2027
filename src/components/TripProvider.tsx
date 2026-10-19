"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type {
  ChecklistDraft,
  ChecklistItem,
  PlanItem,
  PlanItemDraft,
  Suggestion,
  Traveller,
  TripDay,
} from "@/lib/types";

const ME_KEY = "japan27:me";

interface TripState {
  days: TripDay[];
  items: PlanItem[];
  suggestions: Suggestion[];
  checklist: ChecklistItem[];
  loading: boolean;
  error: string | null;
  me: Traveller | null;
  meReady: boolean;
  setMe: (me: Traveller) => void;
  saveItem: (draft: PlanItemDraft) => Promise<PlanItem | null>;
  updateItem: (id: string, patch: Partial<PlanItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateDay: (date: string, patch: Partial<TripDay>) => Promise<void>;
  saveCheck: (draft: ChecklistDraft) => Promise<ChecklistItem | null>;
  updateCheck: (id: string, patch: Partial<ChecklistItem>) => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
  // Sheets live at the app shell so any screen can open them.
  editing: PlanItemDraft | null;
  openItem: (draft: PlanItemDraft) => void;
  closeItem: () => void;
  editingDay: string | null;
  openDay: (date: string) => void;
  closeDay: () => void;
}

const ME_EVENT = "japan27:me-changed";
let memoryMe: Traveller | null = null;

function readMe(): Traveller | null {
  try {
    const saved = localStorage.getItem(ME_KEY);
    if (saved === "josh" || saved === "sam") return saved;
  } catch {}
  return memoryMe;
}

function subscribeMe(cb: () => void) {
  window.addEventListener(ME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(ME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const noop = () => () => {};

async function fetchAll() {
  const [d, i, s, c] = await Promise.all([
    supabase.from("trip_days").select("*").order("date"),
    supabase.from("plan_items").select("*").order("sort_order"),
    supabase.from("suggestions").select("*").order("city"),
    supabase.from("checklist_items").select("*").order("sort_order"),
  ]);
  const err = d.error ?? i.error ?? s.error ?? c.error;
  if (err) return { ok: false as const, error: err.message };
  return {
    ok: true as const,
    days: d.data as TripDay[],
    items: i.data as PlanItem[],
    suggestions: s.data as Suggestion[],
    checklist: c.data as ChecklistItem[],
  };
}

const TripContext = createContext<TripState | null>(null);

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside <TripProvider>");
  return ctx;
}

const upsert = <T,>(list: T[], row: T, key: keyof T) => {
  const i = list.findIndex((r) => r[key] === row[key]);
  if (i === -1) return [...list, row];
  const next = [...list];
  next[i] = row;
  return next;
};

export function TripProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState<TripDay[]>([]);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const me = useSyncExternalStore(subscribeMe, readMe, () => null);
  const meReady = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [editing, setEditing] = useState<PlanItemDraft | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);

  const setMe = useCallback((who: Traveller) => {
    try {
      localStorage.setItem(ME_KEY, who);
    } catch {
      // Storage blocked: fall back to remembering for this tab only.
      memoryMe = who;
    }
    window.dispatchEvent(new Event(ME_EVENT));
  }, []);

  const load = useCallback(
    () =>
      fetchAll().then((r) => {
        if (!r.ok) setError(r.error);
        else {
          setDays(r.days);
          setItems(r.items);
          setSuggestions(r.suggestions);
          setChecklist(r.checklist);
          setError(null);
        }
        setLoading(false);
      }),
    [],
  );

  useEffect(() => {
    fetchAll().then((r) => {
      if (!r.ok) setError(r.error);
      else {
        setDays(r.days);
        setItems(r.items);
        setSuggestions(r.suggestions);
        setChecklist(r.checklist);
      }
      setLoading(false);
    });
    // Live sync so whatever Sam adds shows up on Josh's phone and vice versa.
    const channel = supabase
      .channel("trip")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plan_items" },
        (p) => {
          if (p.eventType === "DELETE") {
            const id = (p.old as { id?: string }).id;
            setItems((list) => list.filter((r) => r.id !== id));
          } else setItems((list) => upsert(list, p.new as PlanItem, "id"));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trip_days" },
        (p) => setDays((list) => upsert(list, p.new as TripDay, "date")),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_items" },
        (p) => {
          if (p.eventType === "DELETE") {
            const id = (p.old as { id?: string }).id;
            setChecklist((list) => list.filter((r) => r.id !== id));
          } else
            setChecklist((list) => upsert(list, p.new as ChecklistItem, "id"));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveItem = useCallback(
    async (draft: PlanItemDraft) => {
      const { id, ...fields } = draft;
      const query = id
        ? supabase.from("plan_items").update(fields).eq("id", id)
        : supabase.from("plan_items").insert({ added_by: me, ...fields });
      const { data, error } = await query.select().single();
      if (error) {
        setError(error.message);
        return null;
      }
      setItems((list) => upsert(list, data as PlanItem, "id"));
      return data as PlanItem;
    },
    [me],
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<PlanItem>) => {
      setItems((list) =>
        list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      const { error } = await supabase
        .from("plan_items")
        .update(patch)
        .eq("id", id);
      if (error) {
        setError(error.message);
        load();
      }
    },
    [load],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setItems((list) => list.filter((r) => r.id !== id));
      const { error } = await supabase.from("plan_items").delete().eq("id", id);
      if (error) {
        setError(error.message);
        load();
      }
    },
    [load],
  );

  const updateDay = useCallback(
    async (date: string, patch: Partial<TripDay>) => {
      setDays((list) =>
        list.map((d) => (d.date === date ? { ...d, ...patch } : d)),
      );
      const { error } = await supabase
        .from("trip_days")
        .update(patch)
        .eq("date", date);
      if (error) {
        setError(error.message);
        load();
      }
    },
    [load],
  );

  const saveCheck = useCallback(async (draft: ChecklistDraft) => {
    const { id, ...fields } = draft;
    const query = id
      ? supabase.from("checklist_items").update(fields).eq("id", id)
      : supabase.from("checklist_items").insert(fields);
    const { data, error } = await query.select().single();
    if (error) {
      setError(error.message);
      return null;
    }
    setChecklist((list) => upsert(list, data as ChecklistItem, "id"));
    return data as ChecklistItem;
  }, []);

  const updateCheck = useCallback(
    async (id: string, patch: Partial<ChecklistItem>) => {
      setChecklist((list) =>
        list.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      const { error } = await supabase
        .from("checklist_items")
        .update(patch)
        .eq("id", id);
      if (error) {
        setError(error.message);
        load();
      }
    },
    [load],
  );

  const deleteCheck = useCallback(
    async (id: string) => {
      setChecklist((list) => list.filter((r) => r.id !== id));
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", id);
      if (error) {
        setError(error.message);
        load();
      }
    },
    [load],
  );

  const value = useMemo<TripState>(
    () => ({
      days,
      items,
      suggestions,
      checklist,
      loading,
      error,
      me,
      meReady,
      setMe,
      saveItem,
      updateItem,
      deleteItem,
      updateDay,
      saveCheck,
      updateCheck,
      deleteCheck,
      editing,
      openItem: setEditing,
      closeItem: () => setEditing(null),
      editingDay,
      openDay: setEditingDay,
      closeDay: () => setEditingDay(null),
    }),
    [
      days,
      items,
      suggestions,
      checklist,
      loading,
      error,
      me,
      meReady,
      setMe,
      saveItem,
      updateItem,
      deleteItem,
      updateDay,
      saveCheck,
      updateCheck,
      deleteCheck,
      editing,
      editingDay,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

/** Items for one day, in the order you'd do them. */
export function itemsForDay(items: PlanItem[], date: string) {
  const slotRank = { morning: 0, afternoon: 1, evening: 2, night: 3 };
  return items
    .filter((i) => i.date === date)
    .sort(
      (a, b) =>
        (a.slot ? slotRank[a.slot] : 1.5) - (b.slot ? slotRank[b.slot] : 1.5) ||
        (a.start_time ?? "99").localeCompare(b.start_time ?? "99") ||
        a.sort_order - b.sort_order,
    );
}
