/**
 * CsvExportDialog.jsx
 * Download CSV (cycle yang punya video) dengan dua mode:
 *   Simple  : geser tanggal di kalender → pilih shift per tanggal → Line → Station
 *   Advance : tanggal + jam (anak dari tanggal, default 07:00) / shift, Line, Station,
 *             tipe (semua/anomaly/normal), jenis (long/short), penanda (skipped/genesis/late)
 * Maksimal 7 hari. Shift 1 tanggal D = (D-1) 19:00 → D 07:00 ; Shift 2 = D 07:00 → 19:00 (WIB).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Box, Flex, Text, Button, Input, NativeSelect } from "@chakra-ui/react";
import { BASE_URL } from "../config";

const MONO = `"JetBrains Mono", "SF Mono", ui-monospace, Consolas, monospace`;
const SANS = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

const HOUR = 3600000,
  DAY = 24 * HOUR,
  WIB = 7 * HOUR;
const MAX_DAYS = 7;
const DEFAULT_TIME = "07:00";
const TOO_LONG = "Tanggal anda terlalu panjang (maksimal 7 hari)";

/* ── helper tanggal (semua dalam WIB) ─────────────────────────────────── */
const ymd = (ms) => new Date(ms + WIB).toISOString().slice(0, 10);
const dayStart = (d) => Date.parse(`${d}T00:00:00+07:00`);
const addDays = (d, n) => ymd(dayStart(d) + n * DAY);
const daysBetween = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY) + 1; // inklusif
const listDays = (a, b) =>
  Array.from({ length: daysBetween(a, b) }, (_, i) => addDays(a, i));
const hm = (t) => {
  const [h, m] = t.split(":").map(Number);
  return (h * 60 + m) * 60000;
};
const fmtDay = (d) =>
  new Date(dayStart(d)).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
  });
const fmtStamp = (ms) =>
  new Date(ms).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/* Shift 1 tanggal d dimulai malam SEBELUMNYA (d-1 19:00). dayStart(d) - 5 jam = (d-1) 19:00 */
const shiftWin = (d, s) =>
  s === 1
    ? [dayStart(d) - 5 * HOUR, dayStart(d) + 7 * HOUR]
    : [dayStart(d) + 7 * HOUR, dayStart(d) + 19 * HOUR];

/* gabungkan rentang yang bersambung (S2 tgl D berakhir 19:00 = S1 tgl D+1 mulai 19:00) */
const merge = (ws) =>
  [...ws]
    .sort((a, b) => a[0] - b[0])
    .reduce((out, w) => {
      const last = out[out.length - 1];
      if (last && last[1] === w[0]) last[1] = w[1];
      else out.push([...w]);
      return out;
    }, []);

/* ── rencana rentang waktu ────────────────────────────────────────────── */
function planSimple(range, off) {
  if (!range.from)
    return { error: "Geser kalender, lalu tekan Konfirmasi.", soft: true };
  if (daysBetween(range.from, range.to) > MAX_DAYS) return { error: TOO_LONG };
  const ws = [];
  for (const d of listDays(range.from, range.to))
    for (const s of [1, 2]) if (!off.has(`${d}|${s}`)) ws.push(shiftWin(d, s));
  return ws.length
    ? { windows: merge(ws) }
    : { error: "Pilih minimal satu shift." };
}

function planAdvance(a, mode, off) {
  if (!a.fromD || !a.toD)
    return { error: "Pilih tanggal From dan To.", soft: true };
  if (a.toD < a.fromD) return { error: "'To' harus setelah 'From'." };
  if (daysBetween(a.fromD, a.toD) > MAX_DAYS) return { error: TOO_LONG };
  if (mode === "shift") return planSimple({ from: a.fromD, to: a.toD }, off); // badge per tanggal
  const from = dayStart(a.fromD) + hm(a.fromT || DEFAULT_TIME);
  const to = dayStart(a.toD) + hm(a.toT || DEFAULT_TIME);
  if (to <= from) return { error: "'To' harus setelah 'From'." };
  if (to - from > MAX_DAYS * DAY) return { error: TOO_LONG };
  return { windows: [[from, to]] };
}

/* filter daftar (array key) → bentuk dialog Advance. Skipped adalah jenis anomaly. */
export function typesFromFilters(filters = []) {
  const hasAnom = filters.some((k) =>
    ["anomaly", "long", "short", "expected"].includes(k),
  );
  const kind =
    filters.includes("normal") && !hasAnom
      ? "normal"
      : hasAnom
        ? "anomaly"
        : "all";
  const MAP = { long: "LONG", short: "SHORT", expected: "SKIPPED" };
  return {
    kind,
    sub: filters.filter((k) => MAP[k]).map((k) => MAP[k]),
    flags: filters.filter((k) => ["genesis", "late"].includes(k)),
  };
}

/* ── gaya ─────────────────────────────────────────────────────────────── */
const lbl = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--ct-ink-500)",
  fontFamily: MONO,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
const field = {
  h: "28px",
  fontSize: "13px",
  fontFamily: MONO,
  bg: "var(--ct-surface)",
  borderColor: "var(--ct-ink-200)",
  color: "var(--ct-black)",
  borderRadius: "3px",
  _focus: {
    borderColor: "var(--ct-blue)",
    boxShadow: "0 0 0 1px var(--ct-blue)",
  },
};

function Chip({ active, disabled, onClick, title, children }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      h="24px"
      minW={0}
      px="10px"
      fontSize="11px"
      fontWeight="700"
      fontFamily={MONO}
      textTransform="uppercase"
      letterSpacing="0.06em"
      borderRadius="3px"
      variant="ghost"
      border="1px solid"
      borderColor={active ? "var(--ct-blue)" : "var(--ct-ink-200)"}
      bg={active ? "var(--ct-blue)" : "var(--ct-surface)"}
      color={active ? "var(--ct-on-accent)" : "var(--ct-ink-600)"}
      _hover={{ bg: active ? "var(--ct-blue-hover)" : "var(--ct-ink-100)" }}
    >
      {children}
    </Button>
  );
}

function Section({ label, children }) {
  return (
    <Box>
      <Text {...lbl} mb="6px">
        {label}
      </Text>
      {children}
    </Box>
  );
}

/* ── kalender geser (drag) ────────────────────────────────────────────── */
function DragCalendar({ value, onChange, onStart }) {
  const today = ymd(Date.now());
  const idx = (new Date(dayStart(today) + WIB).getUTCDay() + 6) % 7; // Senin = 0
  const first = addDays(today, -(idx + 28)); // 5 minggu, berakhir di minggu ini
  const cells = Array.from({ length: 35 }, (_, i) => addDays(first, i));
  const anchor = useRef(null);

  const at = (e) =>
    document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-day]")
      ?.dataset.day;
  const apply = (d) => {
    const a = anchor.current;
    onChange(d >= a ? { from: a, to: d } : { from: d, to: a });
  };

  return (
    <Box
      border="1px solid"
      borderColor="var(--ct-ink-200)"
      borderRadius="4px"
      p="8px"
      bg="var(--ct-canvas)"
      style={{ touchAction: "none", userSelect: "none" }}
      onPointerDown={(e) => {
        const d = at(e);
        if (!d || d > today) return;
        anchor.current = d;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onStart?.();
        onChange({ from: d, to: d });
      }}
      onPointerMove={(e) => {
        if (!anchor.current) return;
        const d = at(e);
        if (d && d <= today) apply(d);
      }}
      onPointerUp={() => {
        anchor.current = null;
      }}
      onPointerCancel={() => {
        anchor.current = null;
      }}
    >
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap="3px">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((w) => (
          <Text key={w} {...lbl} textAlign="center" fontSize="10px">
            {w}
          </Text>
        ))}
        {cells.map((d) => {
          const future = d > today;
          const inSel = value.from && d >= value.from && d <= value.to;
          const edge = inSel && (d === value.from || d === value.to);
          const n = d.slice(8);
          return (
            <Box
              key={d}
              data-day={d}
              title={fmtDay(d)}
              h="34px"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              borderRadius="3px"
              fontFamily={MONO}
              fontSize="12px"
              fontWeight={edge ? 700 : 500}
              cursor={future ? "not-allowed" : "pointer"}
              opacity={future ? 0.35 : 1}
              bg={
                edge
                  ? "var(--ct-blue)"
                  : inSel
                    ? "var(--ct-blue-100)"
                    : "var(--ct-surface)"
              }
              color={
                edge
                  ? "var(--ct-on-accent)"
                  : inSel
                    ? "var(--ct-blue)"
                    : "var(--ct-black)"
              }
              border="1px solid"
              borderColor={
                d === today ? "var(--ct-orange)" : "var(--ct-ink-200)"
              }
            >
              {(n === "01" || d === cells[0]) && (
                <Text fontSize="8px" lineHeight="1" textTransform="uppercase">
                  {new Date(dayStart(d)).toLocaleDateString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    month: "short",
                  })}
                </Text>
              )}
              <span>{n}</span>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ── badge shift per tanggal ──────────────────────────────────────────── */
function ShiftBadges({ range, off, setOff }) {
  if (!range.from || daysBetween(range.from, range.to) > MAX_DAYS) return null;
  const toggle = (k) =>
    setOff((o) => {
      const n = new Set(o);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <Flex wrap="wrap" gap="6px">
      {listDays(range.from, range.to).map((d) => (
        <Flex
          key={d}
          align="center"
          gap="6px"
          px="8px"
          py="4px"
          border="1px solid"
          borderColor="var(--ct-ink-200)"
          borderRadius="4px"
          bg="var(--ct-surface)"
        >
          <Text fontSize="12px" fontFamily={MONO} fontWeight="600" minW="46px">
            {fmtDay(d)}
          </Text>
          <Chip
            active={!off.has(`${d}|1`)}
            onClick={() => toggle(`${d}|1`)}
            title={`Shift 1: ${fmtDay(addDays(d, -1))} 19:00 – ${fmtDay(d)} 07:00`}
          >
            S1
          </Chip>
          <Chip
            active={!off.has(`${d}|2`)}
            onClick={() => toggle(`${d}|2`)}
            title={`Shift 2: ${fmtDay(d)} 07:00 – 19:00`}
          >
            S2
          </Chip>
        </Flex>
      ))}
    </Flex>
  );
}

/* ── Line → Station ───────────────────────────────────────────────────── */
function LineStation({ summary, sel, setSel, locked }) {
  const lines = useMemo(
    () =>
      [...new Set(summary.map((s) => Number(s.line)))].sort((a, b) => a - b),
    [summary],
  );
  const stations = useMemo(
    () =>
      summary
        .filter((s) => String(s.line) === String(sel.line))
        .sort((a, b) => Number(a.station_id) - Number(b.station_id)),
    [summary, sel.line],
  );

  if (locked)
    return (
      <Text fontSize="13px" fontFamily={MONO}>
        Line {sel.line}
        {sel.station ? ` · Station ${sel.station}` : ""}
      </Text>
    );
  return (
    <Flex gap="8px" wrap="wrap">
      <NativeSelect.Root w="130px" size="xs">
        <NativeSelect.Field
          {...field}
          py={0}
          aria-label="Line"
          value={sel.line}
          onChange={(e) => setSel({ line: e.target.value, station: "" })}
        >
          <option value="">Semua line</option>
          {lines.map((l) => (
            <option key={l} value={l}>
              Line {l}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <NativeSelect.Root w="230px" size="xs" disabled={!sel.line}>
        <NativeSelect.Field
          {...field}
          py={0}
          aria-label="Station"
          value={sel.station}
          onChange={(e) => setSel((s) => ({ ...s, station: e.target.value }))}
        >
          <option value="">Semua station</option>
          {stations.map((s) => (
            <option key={s.station_id} value={s.station_id}>
              ST{s.station_id} — {s.station_name}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Flex>
  );
}

/* ── dialog ───────────────────────────────────────────────────────────── */
export default function CsvExportDialog({ onClose, summary = [], initial }) {
  const [mode, setMode] = useState("simple");
  const [sel, setSel] = useState(initial.sel);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // simple: draft = hasil geser, range = sudah dikonfirmasi (hanya ini yang memunculkan badge)
  const initSimple =
    initial.range.fromD && initial.range.toD
      ? { from: initial.range.fromD, to: initial.range.toD }
      : { from: "", to: "" };
  const [range, setRange] = useState(initSimple);
  const [draft, setDraft] = useState(initSimple);
  const [off, setOff] = useState(() => new Set());

  const draftDays = draft.from ? daysBetween(draft.from, draft.to) : 0;
  const draftTooLong = draftDays > MAX_DAYS;
  const confirmed =
    !!range.from && range.from === draft.from && range.to === draft.to;
  const confirmDraft = () => {
    setRange(draft);
    setOff(new Set());
  };
  const resetConfirmed = () => {
    setRange({ from: "", to: "" });
    setOff(new Set());
  };

  // advance
  const [adv, setAdv] = useState({ ...initial.range });
  const [advMode, setAdvMode] = useState("time"); // "time" = rentang jam langsung | "shift" = badge per tanggal
  const [advOff, setAdvOff] = useState(() => new Set());
  const [t, setT] = useState(initial.types); // { kind: all|anomaly|normal, sub: [LONG,SHORT,SKIPPED], flags: [genesis,late] }
  const today = ymd(Date.now());

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setD = (side, v) =>
    setAdv((a) => ({
      ...a,
      [`${side}D`]: v,
      [`${side}T`]: v ? a[`${side}T`] || DEFAULT_TIME : "",
    }));
  const setTm = (side, v) =>
    setAdv((a) => ({ ...a, [`${side}T`]: v || DEFAULT_TIME })); // jam wajib
  const toggle = (key, val) =>
    setT((x) => ({
      ...x,
      [key]: x[key].includes(val)
        ? x[key].filter((k) => k !== val)
        : [...x[key], val],
    }));

  const plan = useMemo(
    () =>
      mode === "simple"
        ? planSimple(range, off)
        : planAdvance(adv, advMode, advOff),
    [mode, range, off, adv, advMode, advOff],
  );

  const params = useMemo(() => {
    if (!plan.windows) return null;
    const p = {
      windows: JSON.stringify(
        plan.windows.map(([a, b]) => [
          new Date(a).toISOString(),
          new Date(b).toISOString(),
        ]),
      ),
    };
    if (sel.line) p.line = sel.line;
    if (sel.station) p.station_id = sel.station;
    if (mode === "advance") {
      if (t.kind === "anomaly") {
        p.anomaly = "true";
        const types = t.sub.filter((s) => s === "LONG" || s === "SHORT");
        if (types.length) p.atype = types.join(",");
        if (t.sub.includes("SKIPPED")) p.expected = "true";
        if (t.sub.length) p.anysub = "true"; // Long / Short / Skipped digabung OR
      } else if (t.kind === "normal") p.anomaly = "false";
      if (t.flags.includes("genesis")) p.genesis = "true";
      if (t.flags.includes("late")) p.late = "true";
    }
    return p;
  }, [plan, sel, mode, t]);

  const summaryText = useMemo(() => {
    if (!plan.windows) return "";
    const first = plan.windows[0][0],
      last = plan.windows[plan.windows.length - 1][1];
    const parts = [`${fmtStamp(first)} → ${fmtStamp(last)}`];
    if (plan.windows.length > 1) parts.push(`${plan.windows.length} rentang`);
    parts.push(sel.line ? `Line ${sel.line}` : "Semua line");
    parts.push(sel.station ? `ST ${sel.station}` : "Semua station");
    if (mode === "advance") {
      parts.push(
        t.kind === "anomaly"
          ? "Anomaly"
          : t.kind === "normal"
            ? "Normal"
            : "Semua tipe",
      );
      if (t.kind === "anomaly" && t.sub.length) parts.push(t.sub.join("+"));
      t.flags.forEach((f) => parts.push(f === "genesis" ? "Genesis" : "Late"));
    }
    return parts.join(" · ");
  }, [plan, sel, mode, t]);

  const run = async () => {
    if (!params) return;
    setBusy(true);
    setErr("");
    try {
      const res = await axios.get(`${BASE_URL}/api/videos/export`, {
        params,
        responseType: "blob",
      });
      const first = plan.windows[0][0],
        last = plan.windows[plan.windows.length - 1][1];
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `videos_${ymd(first)}_${ymd(last - 1)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onClose();
    } catch (e) {
      let msg = e.message;
      const body = e.response?.data;
      if (body instanceof Blob) {
        try {
          msg = JSON.parse(await body.text()).error || msg;
        } catch {
          /* abaikan */
        }
      }
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };
  const timeOff = (side) => !adv[`${side}D`];

  return (
    <Box
      onClick={onClose}
      position="fixed"
      inset={0}
      bg="var(--ct-overlay)"
      zIndex={1000}
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      pt="6vh"
      fontFamily={SANS}
    >
      <Box
        role="dialog"
        aria-label="Download CSV"
        onClick={(e) => e.stopPropagation()}
        bg="var(--ct-surface)"
        borderRadius="8px"
        w="min(640px, 95vw)"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* header */}
        <Flex
          align="center"
          justify="space-between"
          px="21px"
          py="13px"
          borderBottom="1px solid var(--ct-ink-200)"
        >
          <Text fontSize="15px" fontWeight="700" color="var(--ct-black)">
            Download CSV
          </Text>
          <Button
            variant="ghost"
            onClick={onClose}
            h="24px"
            minW={0}
            px="8px"
            fontSize="16px"
            color="var(--ct-ink-500)"
            aria-label="Tutup"
          >
            ×
          </Button>
        </Flex>

        {/* body */}
        <Flex
          direction="column"
          gap="16px"
          px="21px"
          py="16px"
          overflowY="auto"
          style={{ scrollbarGutter: "stable" }}
        >
          <Flex gap="6px">
            <Chip active={mode === "simple"} onClick={() => setMode("simple")}>
              Simple
            </Chip>
            <Chip
              active={mode === "advance"}
              onClick={() => setMode("advance")}
            >
              Advance
            </Chip>
          </Flex>

          {mode === "simple" ? (
            <>
              <Section label="Tanggal (geser, lalu konfirmasi)">
                <DragCalendar
                  value={draft}
                  onChange={setDraft}
                  onStart={resetConfirmed}
                />
                <Flex
                  mt="6px"
                  h="28px"
                  align="center"
                  justify="space-between"
                  gap="8px"
                >
                  <Text
                    fontSize="12px"
                    fontFamily={MONO}
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    minW={0}
                    color={
                      draftTooLong
                        ? "var(--ct-orange-700)"
                        : "var(--ct-ink-600)"
                    }
                  >
                    {!draft.from
                      ? "Belum ada tanggal dipilih"
                      : draftTooLong
                        ? TOO_LONG
                        : `${fmtDay(draft.from)} → ${fmtDay(draft.to)} · ${draftDays} hari`}
                  </Text>
                  <Button
                    onClick={confirmDraft}
                    disabled={!draft.from || draftTooLong || confirmed}
                    h="24px"
                    minW={0}
                    px="12px"
                    fontSize="11px"
                    fontFamily={MONO}
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    flexShrink={0}
                    bg="var(--ct-blue)"
                    color="var(--ct-on-accent)"
                    _hover={{ bg: "var(--ct-blue-hover)" }}
                  >
                    {confirmed ? "Terkonfirmasi ✓" : "Konfirmasi"}
                  </Button>
                </Flex>
              </Section>

              {confirmed && (
                <Section label="Shift per tanggal">
                  <ShiftBadges range={range} off={off} setOff={setOff} />
                  <Text mt="6px" fontSize="11px" color="var(--ct-ink-500)">
                    S1 tanggal {fmtDay(range.from)} dimulai{" "}
                    {fmtDay(addDays(range.from, -1))} pukul 19:00.
                  </Text>
                </Section>
              )}

              <Section label="Line → Station">
                <LineStation
                  summary={summary}
                  sel={sel}
                  setSel={setSel}
                  locked={initial.locked}
                />
              </Section>
            </>
          ) : (
            <>
              <Section label="Mode waktu">
                <Flex gap="6px">
                  <Chip
                    active={advMode === "time"}
                    onClick={() => setAdvMode("time")}
                  >
                    Rentang jam
                  </Chip>
                  <Chip
                    active={advMode === "shift"}
                    onClick={() => setAdvMode("shift")}
                  >
                    Per shift
                  </Chip>
                </Flex>
                <Text mt="6px" fontSize="11px" color="var(--ct-ink-500)">
                  {advMode === "time"
                    ? "Tanggal dan jam langsung, tanpa filter shift."
                    : "Pilih tanggal, lalu pilih shift untuk tiap tanggal."}
                </Text>
              </Section>

              <Section
                label={advMode === "time" ? "Tanggal dan jam" : "Tanggal"}
              >
                <Flex align="center" gap="8px" wrap="wrap">
                  <Input
                    {...field}
                    type="date"
                    w="140px"
                    aria-label="From date"
                    max={today}
                    value={adv.fromD}
                    onChange={(e) => setD("from", e.target.value)}
                  />
                  {advMode === "time" && (
                    <Input
                      {...field}
                      type="time"
                      w="100px"
                      aria-label="From time"
                      value={adv.fromT}
                      disabled={timeOff("from")}
                      onChange={(e) => setTm("from", e.target.value)}
                    />
                  )}
                  <Text fontSize="12px" color="var(--ct-ink-400)">
                    →
                  </Text>
                  <Input
                    {...field}
                    type="date"
                    w="140px"
                    aria-label="To date"
                    min={adv.fromD || undefined}
                    max={today}
                    value={adv.toD}
                    onChange={(e) => setD("to", e.target.value)}
                  />
                  {advMode === "time" && (
                    <Input
                      {...field}
                      type="time"
                      w="100px"
                      aria-label="To time"
                      value={adv.toT}
                      disabled={timeOff("to")}
                      onChange={(e) => setTm("to", e.target.value)}
                    />
                  )}
                </Flex>
                {advMode === "time" && (
                  <Text mt="6px" fontSize="11px" color="var(--ct-ink-500)">
                    Jam mengikuti tanggal dan default 07:00.
                  </Text>
                )}
              </Section>

              {advMode === "shift" &&
                adv.fromD &&
                adv.toD &&
                adv.toD >= adv.fromD && (
                  <Section label="Shift per tanggal">
                    <ShiftBadges
                      range={{ from: adv.fromD, to: adv.toD }}
                      off={advOff}
                      setOff={setAdvOff}
                    />
                    <Text mt="6px" fontSize="11px" color="var(--ct-ink-500)">
                      S1 tanggal {fmtDay(adv.fromD)} dimulai{" "}
                      {fmtDay(addDays(adv.fromD, -1))} pukul 19:00.
                    </Text>
                  </Section>
                )}

              <Section label="Line → Station">
                <LineStation
                  summary={summary}
                  sel={sel}
                  setSel={setSel}
                  locked={initial.locked}
                />
              </Section>

              <Section label="Tipe">
                <Flex gap="6px" wrap="wrap">
                  {[
                    ["all", "Semua"],
                    ["anomaly", "Anomaly saja"],
                    ["normal", "Normal saja"],
                  ].map(([k, l]) => (
                    <Chip
                      key={k}
                      active={t.kind === k}
                      onClick={() =>
                        setT((x) => ({
                          ...x,
                          kind: k,
                          sub: k === "anomaly" ? x.sub : [],
                        }))
                      }
                    >
                      {l}
                    </Chip>
                  ))}
                </Flex>
              </Section>

              <Section label="Jenis anomaly">
                <Flex gap="6px" wrap="wrap">
                  {[
                    ["LONG", "Long"],
                    ["SHORT", "Short"],
                    ["SKIPPED", "Skipped"],
                  ].map(([k, l]) => (
                    <Chip
                      key={k}
                      active={t.sub.includes(k)}
                      disabled={t.kind !== "anomaly"}
                      onClick={() => toggle("sub", k)}
                    >
                      {l}
                    </Chip>
                  ))}
                </Flex>
                <Text mt="6px" fontSize="11px" color="var(--ct-ink-500)">
                  Aktif hanya untuk "Anomaly saja". Tanpa pilihan = semua
                  anomaly. Beberapa pilihan digabung (atau).
                </Text>
              </Section>

              <Section label="Penanda">
                <Flex gap="6px" wrap="wrap">
                  <Chip
                    active={t.flags.includes("genesis")}
                    onClick={() => toggle("flags", "genesis")}
                  >
                    Genesis
                  </Chip>
                  <Chip
                    active={t.flags.includes("late")}
                    onClick={() => toggle("flags", "late")}
                  >
                    Late
                  </Chip>
                </Flex>
              </Section>
            </>
          )}
        </Flex>

        {/* footer */}
        <Box
          px="21px"
          py="13px"
          borderTop="1px solid var(--ct-ink-200)"
          bg="var(--ct-ink-50)"
        >
          {plan.error && (
            <Text
              fontSize="12px"
              fontFamily={MONO}
              mb="6px"
              color={plan.soft ? "var(--ct-ink-500)" : "var(--ct-orange-700)"}
            >
              {plan.error}
            </Text>
          )}
          {summaryText && (
            <Text
              fontSize="11px"
              fontFamily={MONO}
              color="var(--ct-ink-600)"
              mb="6px"
            >
              {summaryText}
            </Text>
          )}
          {err && (
            <Text
              fontSize="12px"
              fontFamily={MONO}
              color="var(--ct-orange-700)"
              mb="6px"
            >
              {err}
            </Text>
          )}
          <Flex justify="flex-end" gap="8px">
            <Button
              variant="outline"
              onClick={onClose}
              h="28px"
              px="14px"
              fontSize="11px"
              fontFamily={MONO}
              textTransform="uppercase"
              letterSpacing="0.06em"
              fontWeight="700"
            >
              Batal
            </Button>
            <Button
              onClick={run}
              disabled={!params || busy}
              h="28px"
              px="14px"
              fontSize="11px"
              fontFamily={MONO}
              textTransform="uppercase"
              letterSpacing="0.06em"
              fontWeight="700"
              bg="var(--ct-blue)"
              color="var(--ct-on-accent)"
              _hover={{ bg: "var(--ct-blue-hover)" }}
            >
              {busy ? "Menyiapkan…" : "Download CSV"}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
