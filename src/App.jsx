/**
 * App.jsx — CT Monitor dashboard shell.
 * Palette: Astra blue #005A9C · orange #F7941D · ink #231F20
 *
 * Direction: Precision & Density (technical, mono-for-data, borders-only).
 *
 * NOTE: The 32px grid background previously applied via `css={{ "&::before": ... }}`
 * on the root <Box> has been removed — it read as decorative texture and did not
 * serve the "borders-only, information-forward" direction. To restore it, re-add
 * the `css` prop to the outer <Box> with `position: "relative"` and the ::before
 * gradient block.
 */
import React, { useState } from "react";
import {
  ChakraProvider, Box, Flex, Text, Button, Image, HStack, VStack,
} from "@chakra-ui/react";

import { system } from "./theme";
import StationConnectivity, { useDbHealth } from "./components/StationConnectivity";
import { useSocket } from "./hooks/useSocket";
import StationDetail from "./components/StationDetail";
import AnomalyList from "./components/AnomalyList";
import StationTimeline from "./components/StationTimeline";
import StationRegister from "./components/StationRegister";
import logoGif from "./assets/logo.png";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeModeProvider, useThemeMode } from "./hooks/useThemeMode";
import ThemeToggle from "./components/ThemeToggle";
import AuthGate from "./components/AuthGate";
import UserMenu from "./components/UserMenu";
import LineGroups from "./components/LineGroups";
import StationDrawer, { DRAWER_W, usePushLayout } from "./components/StationDrawer";

/* ── Palette ─────────────────────────────────────────────────────────── */
const P = {
  blue: "var(--ct-blue)", blueActive: "var(--ct-blue-active)",
  blue700: "var(--ct-blue-700)", blue200: "var(--ct-blue-200)", blue100: "var(--ct-blue-100)", blue50: "var(--ct-blue-50)",
  orange: "var(--ct-orange)", orange700: "var(--ct-orange-700)", orange100: "var(--ct-orange-100)", orange50: "var(--ct-orange-50)",
  black: "var(--ct-black)",
  ink600: "var(--ct-ink-600)", ink500: "var(--ct-ink-500)", ink300: "var(--ct-ink-300)", ink200: "var(--ct-ink-200)",
  white: "var(--ct-surface)", canvas: "var(--ct-canvas)",
};

/* ── Type / space / size (4px grid) ──────────────────────────────────── */
const SANS = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
const MONO = `"JetBrains Mono", "SF Mono", ui-monospace, "Cascadia Code", Consolas, monospace`;

const FS = { micro: "11px", tiny: "12px", cap: "13px", med: "16px" };
const SP = { sm: "4px", md: "8px", lg: "12px", xl: "24px" };
const RADII = { xs: "2px", md: "4px", lg: "6px" };
const SZ = { header: "72px", action: "32px", pill: "28px", logo: "32px" };
const PX = { base: SP.lg, md: SP.xl };
const PY = { base: SP.lg, md: SP.xl };
const FOCUS_BLUE = { boxShadow: `0 0 0 3px ${P.blue100}` };

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const SLIDE = `astra-slide 220ms ${EASE}`;

/* ── Keyframes ───────────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes astra-pulse      { 0%{box-shadow:0 0 0 0 rgba(var(--ct-blue-rgb),.35)} 70%{box-shadow:0 0 0 5px rgba(var(--ct-blue-rgb),0)} 100%{box-shadow:0 0 0 0 rgba(var(--ct-blue-rgb),0)} }
@keyframes astra-pulse-warn { 0%{box-shadow:0 0 0 0 rgba(var(--ct-orange-rgb),.4)} 70%{box-shadow:0 0 0 5px rgba(var(--ct-orange-rgb),0)} 100%{box-shadow:0 0 0 0 rgba(var(--ct-orange-rgb),0)} }
@keyframes astra-slide      { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;

const stKey = (s) => `${s.line}-${s.station_id}`;

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <ChakraProvider value={system}>
          <AuthGate>
            <Dashboard />
          </AuthGate>
        </ChakraProvider>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

function Dashboard() {
  const {
    summary, heartbeats, recentCycles, connected,
    fetchHistory, fetchHourly, fetchStats, exportCSV,
  } = useSocket();

  const [page, setPage] = useState("dashboard");
  const [selectedKey, setSelectedKey] = useState(null);
  const dbOk = useDbHealth(connected);
  const push = usePushLayout();

  const selected = summary.find((s) => stKey(s) === selectedKey) || null;

  if (page === "station-register") {
    return (
      <StationRegisterPage
        connected={connected}
        onBack={() => setPage("dashboard")}
      />
    );
  }

  return (
    <Box
      minH="100vh" bg={P.canvas} fontFamily={SANS}
      style={{
        paddingRight: push && selected ? DRAWER_W : 0,
        transition: `padding-right 220ms ${EASE}`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <Header connected={connected} onOpenRegister={() => setPage("station-register")} />

      <Box maxW="1800px" mx="auto" px={PX} py={PY} position="relative" zIndex={1}>
        <StationGrid
          summary={summary}
          heartbeats={heartbeats}
          connected={connected}
          onSelect={(k) => setSelectedKey(k === selectedKey ? null : k)}
        />

        <Box mb={SP.lg}>
          <AnomalyList
            summary={summary}
            line={selected?.line ?? ""}
            stationId={selected?.station_id ?? ""}
          />
        </Box>

        <StationDrawer
          open={!!selected}
          onClose={() => setSelectedKey(null)}
          title={selected ? `Station Inspect · L${selected.line} ST${selected.station_id}` : ""}
          scrollKey={selectedKey}
          push={push}
        >
          {selected && (
            <SelectedStationDetail
              station={selected}
              heartbeat={heartbeats[stKey(selected)]}
              connected={connected}
              dbOk={dbOk}
              fetchHistory={fetchHistory}
              fetchHourly={fetchHourly}
              fetchStats={fetchStats}
              exportCSV={exportCSV}
              recentCycles={recentCycles}
            />
          )}
        </StationDrawer>
      </Box>
    </Box>
  );
}

/* ── Header ──────────────────────────────────────────────────────────── */
function Header({ connected, onOpenRegister }) {
  return (
    <Flex
      h={{ base: "auto", md: SZ.header }} minH={{ md: SZ.header }}
      px={PX} py={{ base: SP.lg, md: 0 }}
      bg="var(--ct-header-bg)" borderBottomWidth="1px" borderColor="var(--ct-header-border)"
      align={{ base: "stretch", md: "center" }} justify="space-between"
      gap={SP.md} direction={{ base: "column", md: "row" }}
      position="relative" zIndex={10}
    >
      <BrandBlock subtitle="Final Assembly" />

      <Flex
        align="center" justify={{ base: "space-between", md: "flex-end" }}
        gap={{ base: SP.md, md: SP.xl }} flexWrap="wrap" minW="0"
      >
        <Button
          variant="outline" onClick={onOpenRegister}
          h={SZ.action} px={SP.lg}
          fontSize={FS.tiny} fontWeight="600" fontFamily={MONO}
          letterSpacing="0.08em" textTransform="uppercase"
          borderRadius={RADII.md} borderColor={P.ink200} color={P.ink600} bg={P.white}
          flexShrink={0}
          transition={`background-color 150ms ${EASE}, border-color 150ms ${EASE}, color 150ms ${EASE}`}
          _hover={{ bg: P.blue50, borderColor: P.blue200, color: P.blue }}
          _active={{ bg: P.blue100, color: P.blueActive }}
          _focusVisible={FOCUS_BLUE}
        >
          Station Register
        </Button>
        <ConnectionPill connected={connected} />
        <ThemeToggle size={SZ.action} />
        <UserMenu />
      </Flex>
    </Flex>
  );
}

function BrandBlock({ subtitle }) {
  const { mode } = useThemeMode();
  const dark = mode === "dark";

  return (
    <HStack gap={SP.md} align="center" minW="0">
      {dark ? (
        <Box flexShrink={0} aria-label="Astra Visteon Indonesia">
          <Text fontSize="15px" fontWeight="700" color="#FFFFFF" letterSpacing="-0.02em" lineHeight="1.1" whiteSpace="nowrap">
            Astra Visteon
          </Text>
          <Text fontSize="11px" fontWeight="600" color="#FFFFFF" letterSpacing="0.32em" lineHeight="1.2" whiteSpace="nowrap">
            INDONESIA
          </Text>
        </Box>
      ) : (
        <Image src={logoGif} alt="Astra Visteon Indonesia" h={SZ.logo} w="auto" objectFit="contain" flexShrink={0} />
      )}

      {dark && <Box w="1px" h="26px" bg={P.ink200} flexShrink={0} aria-hidden="true" />}

      <VStack align="flex-start" gap="2px" minW="0">
        <Text fontSize={FS.med} fontWeight="700" color={P.black} lineHeight="1.15" letterSpacing="-0.01em">
          CT Monitor
        </Text>
        <Text
          fontSize={FS.micro} color={P.ink500} fontFamily={MONO}
          letterSpacing="0.1em" textTransform="uppercase" lineHeight="1.2"
          whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis"
        >
          {subtitle}
        </Text>
      </VStack>
    </HStack>
  );
}

/* ── Connection pill ─────────────────────────────────────────────────── */
function ConnectionPill({ connected }) {
  const t = connected
    ? { dot: P.blue, bg: P.blue50, bd: P.blue100, fg: P.blue700, pulse: "astra-pulse", copy: "SYS · ONLINE", aria: "System online" }
    : { dot: P.orange, bg: P.orange50, bd: P.orange100, fg: P.orange700, pulse: "astra-pulse-warn", copy: "SYS · OFFLINE", aria: "System offline" };

  return (
    <HStack
      gap={SP.sm} px={SP.md} h={SZ.pill} borderRadius={RADII.md}
      bg={t.bg} border="1px solid" borderColor={t.bd} flexShrink={0}
      role="status" aria-label={t.aria}
    >
      <Box
        w="6px" h="6px" borderRadius="full" bg={t.dot}
        style={{ animation: `${t.pulse} 2s infinite` }} aria-hidden="true"
      />
      <Text fontSize={FS.micro} color={t.fg} fontWeight="700" fontFamily={MONO} letterSpacing="0.06em" lineHeight="1">
        {t.copy}
      </Text>
    </HStack>
  );
}

/* ── Station grid ────────────────────────────────────────────────────── */
function StationGrid({ summary, heartbeats, connected, onSelect }) {
  return (
    <Box mb={SP.lg}>
      {summary.length === 0 ? (
        <EmptyStationState connected={connected} />
      ) : (
        <LineGroups
          stations={summary}
          heartbeats={heartbeats}
          onSelect={(station) => onSelect(stKey(station))}
        />
      )}
    </Box>
  );
}

function EmptyStationState({ connected }) {
  const t = connected
    ? { dot: P.blue, pulse: "astra-pulse", text: "Fetching station data…", chip: "Syncing", bg: P.blue50, fg: P.blue700, bd: P.blue100 }
    : { dot: P.orange, pulse: "astra-pulse-warn", text: "Awaiting backend connection…", chip: "Offline", bg: P.orange50, fg: P.orange700, bd: P.orange100 };

  return (
    <Box
      py={16} px={SP.lg} textAlign="center" bg={P.white}
      borderRadius={RADII.lg} border="1px dashed" borderColor={P.ink300}
      style={{ animation: SLIDE }}
    >
      <VStack gap={SP.md}>
        <Box w="8px" h="8px" borderRadius="full" bg={t.dot} style={{ animation: `${t.pulse} 2s infinite` }} aria-hidden="true" />
        <Text fontSize={FS.cap} color={P.ink500} fontFamily={MONO} letterSpacing="0.05em">{t.text}</Text>
        <Box
          as="span" display="inline-flex" alignItems="center" h="20px" px={SP.md}
          fontSize={FS.micro} fontWeight="700" fontFamily={MONO}
          textTransform="uppercase" letterSpacing="0.07em" lineHeight="1"
          borderRadius={RADII.xs} bg={t.bg} color={t.fg} border="1px solid" borderColor={t.bd}
        >
          {t.chip}
        </Box>
      </VStack>
    </Box>
  );
}

/* ── Selected station detail ─────────────────────────────────────────── */
function SelectedStationDetail({
  station, heartbeat, connected, dbOk,
  fetchHistory, fetchHourly, fetchStats, exportCSV, recentCycles,
}) {
  return (
    <Box>
      <Box
        mb={SP.lg} p={SP.lg} bg={P.white}
        borderWidth="1px" borderColor={P.ink200}
        borderRadius={RADII.lg}
      >
        <Text
          mb={SP.md}
          fontSize={FS.micro} fontWeight="600" color={P.ink500} fontFamily={MONO}
          letterSpacing="0.09em" textTransform="uppercase" lineHeight="1.2"
        >
          Connectivity Diagnostics
        </Text>
        <StationConnectivity heartbeat={heartbeat} connected={connected} dbOk={dbOk} />
      </Box>

      <StationTimeline station={station} heartbeat={heartbeat} />

      <Box mt={SP.lg}>
        <StationDetail
          station={station}
          fetchHistory={fetchHistory}
          fetchHourly={fetchHourly}
          fetchStats={fetchStats}
          exportCSV={exportCSV}
          recentCycles={recentCycles}
        />
      </Box>
    </Box>
  );
}

/* ── Station register page ───────────────────────────────────────────── */
function StationRegisterPage({ connected, onBack }) {
  return (
    <Box minH="100vh" bg={P.canvas} fontFamily={SANS}>
      <style>{KEYFRAMES}</style>
      <Flex
        h={SZ.header} px={PX} bg="var(--ct-header-bg)"
        borderBottomWidth="1px" borderColor="var(--ct-header-border)"
        align="center" justify="space-between"
      >
        <BrandBlock subtitle="Station Register" />
        <HStack gap={SP.md}>
          <ConnectionPill connected={connected} />
          <ThemeToggle size={SZ.action} />
          <UserMenu />
          <Button
            variant="outline" onClick={onBack}
            h={SZ.action} px={SP.lg}
            fontSize={FS.tiny} fontWeight="600" fontFamily={MONO}
            letterSpacing="0.08em" textTransform="uppercase"
            borderRadius={RADII.md} borderColor={P.ink200} color={P.ink600} bg={P.white}
            transition={`background-color 150ms ${EASE}, border-color 150ms ${EASE}, color 150ms ${EASE}`}
            _hover={{ bg: P.blue50, borderColor: P.blue200, color: P.blue }}
            _focusVisible={FOCUS_BLUE}
          >
            Back to Dashboard
          </Button>
        </HStack>
      </Flex>
      <Box maxW="1800px" mx="auto" p={PX} style={{ animation: SLIDE }}>
        <StationRegister onBack={onBack} />
      </Box>
    </Box>
  );
}