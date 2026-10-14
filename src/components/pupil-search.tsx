"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchPupils, type PupilHit } from "@/app/(app)/paiements/actions";
import { formatFCFA, fullName } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Debounced (200 ms) pupil search with keyboard navigation. Matches last name,
 * first name, parent name and phone digits.
 */
export function PupilSearch({ onSelect, autoFocus }: { onSelect: (hit: PupilHit) => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PupilHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const seq = useRef(0);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function onQueryChange(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    const q = value.trim();
    const mySeq = ++seq.current;
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const res = await searchPupils(q);
      if (mySeq === seq.current) {
        setHits(res);
        setActive(0);
        setLoading(false);
      }
    }, 200);
  }

  const showList = query.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Rechercher un élève"
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Nom, prénom, parent ou téléphone…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && hits[active]) {
              e.preventDefault();
              onSelect(hits[active]);
            }
          }}
          className="block h-12 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-base focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
        />
        {loading && <Loader2 className="absolute top-1/2 right-3 size-5 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />}
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="mt-2 max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white"
        >
          {hits.length === 0 && !loading && <li className="px-4 py-3 text-slate-500">Aucun élève trouvé.</li>}
          {hits.map((h, i) => (
            <li key={h.pupil_id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => onSelect(h)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                  i === active && "bg-primary-soft",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {fullName(h)}
                    {!h.is_active && <span className="ml-2 text-sm font-normal text-slate-500">(parti)</span>}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {h.class_name}
                    {h.parent_name ? ` · ${h.parent_name}` : ""}
                  </span>
                </span>
                <span className={cn("tabular shrink-0 text-sm font-semibold", h.remaining > 0 ? "text-warning" : "text-success")}>
                  {h.remaining > 0 ? `Reste ${formatFCFA(h.remaining)}` : "À jour"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
