import React from "react";
import { Box, Button, HStack, VStack, Text } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";

const P = {
  blue: "var(--ct-blue)",
  blueActive: "var(--ct-blue-active)",
  blue200: "var(--ct-blue-200)",
  blue100: "var(--ct-blue-100)",
  blue50: "var(--ct-blue-50)",

  orange700: "var(--ct-orange-700)",
  orange100: "var(--ct-orange-100)",
  orange50: "var(--ct-orange-50)",

  black: "var(--ct-black)",
  ink700: "var(--ct-ink-700)",
  ink600: "var(--ct-ink-600)",
  ink200: "var(--ct-ink-200)",
  ink100: "var(--ct-ink-100)",
  white: "var(--ct-surface)",
};

const MONO = `"JetBrains Mono", "SF Mono", ui-monospace, Consolas, monospace`;
const SANS = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

const SP = { "2xs": "2px", sm: "5px", md: "8px", lg: "13px" };
const FS = { tiny: "10px", body: "13px" };
const RADII = { xs: "2px", md: "4px", pill: "999px" };

const H = {
  avatar: "28px",
  roleBadge: "16px",
  logout: "26px",
  divider: "22px",
  nameMax: "160px",
  avatarInitials: "10px",
  statusDot: "6px",
};

const FOCUS_BLUE = { boxShadow: `0 0 0 3px ${P.blue100}` };

const TAG_CUT =
  "polygon(0 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)";

const ROLE_DEFS = {
  admin: {
    key: "admin",
    label: "Admin",
    tone: "blue",
    tooltip: "Full access to all features",
  },
  operator: {
    key: "operator",
    label: "Operator",
    tone: "orange",
    tooltip: "Operational access",
  },
  user: { key: "user", label: "User", tone: "ink", tooltip: "Standard access" },
  guest: {
    key: "guest",
    label: "Guest",
    tone: "ink",
    tooltip: "Read-only access",
  },
};

const DEFAULT_ROLE = ROLE_DEFS.user;

const ROLE_TONE_STYLES = {
  blue: { bg: P.blue50, fg: P.blue, bd: P.blue100 },
  orange: { bg: P.orange50, fg: P.orange700, bd: P.orange100 },
  ink: { bg: P.ink100, fg: P.ink700, bd: P.ink200 },
};

function safeString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function getDisplayName(user) {
  if (!user) return "User";

  const direct =
    safeString(user.name) ||
    safeString(user.displayName) ||
    safeString(user.username);
  if (direct) return direct;

  const email = safeString(user.email);
  if (email) {
    const localPart = email.split("@")[0];
    if (localPart) return localPart;
  }

  return "User";
}

function getInitials(name) {
  const trimmed = safeString(name);
  if (!trimmed) return "U";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";

  if (words.length === 1) {
    const w = words[0];
    if (w.length === 1) return w.toUpperCase();
    return (w[0] + w[1]).toUpperCase();
  }

  const first = words[0][0] || "";
  const last = words[words.length - 1][0] || "";
  return (first + last).toUpperCase();
}

function getRoleKey(user) {
  const raw = safeString(user?.role).toLowerCase();
  return ROLE_DEFS[raw] ? raw : DEFAULT_ROLE.key;
}

function getRoleTone(user) {
  return (ROLE_DEFS[getRoleKey(user)] || DEFAULT_ROLE).tone;
}

function UserAvatar({ name, tone = "blue", ...rest }) {
  const initials = getInitials(name);
  const style = ROLE_TONE_STYLES[tone] || ROLE_TONE_STYLES.ink;

  return (
    <Box position="relative" display="inline-flex" flexShrink={0}>
      <Box
        w={H.avatar}
        h={H.avatar}
        minW={H.avatar}
        borderRadius={RADII.pill}
        bg={P.blue50}
        color={P.blue}
        boxShadow={`0 0 0 1px ${P.white}, 0 0 0 2px ${style.bd}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontFamily={MONO}
        fontSize={H.avatarInitials}
        fontWeight="700"
        letterSpacing="0.02em"
        lineHeight="1"
        userSelect="none"
        aria-hidden="true"
        title={name || undefined}
        transition="background-color 140ms ease, box-shadow 140ms ease"
        _hover={{
          bg: P.blue100,
          boxShadow: `0 0 0 1px ${P.white}, 0 0 0 2px ${style.fg}`,
        }}
        {...rest}
      >
        {initials}
      </Box>

      <Box
        position="absolute"
        right="-1px"
        bottom="-1px"
        w={H.statusDot}
        h={H.statusDot}
        borderRadius="999px"
        bg={style.fg}
        boxShadow={`0 0 0 2px ${P.white}`}
        aria-hidden="true"
      />
    </Box>
  );
}

function RoleBadge({ role, ...rest }) {
  const def = ROLE_DEFS[role] || DEFAULT_ROLE;
  const style = ROLE_TONE_STYLES[def.tone] || ROLE_TONE_STYLES.ink;

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      h={H.roleBadge}
      px={SP.sm}
      fontSize={FS.tiny}
      fontWeight="700"
      fontFamily={MONO}
      textTransform="uppercase"
      letterSpacing="0.07em"
      lineHeight="1"
      bg={style.bg}
      color={style.fg}
      boxShadow={`inset 0 0 0 1px ${style.bd}`}
      clipPath={TAG_CUT}
      title={def.tooltip}
      {...rest}
    >
      {def.label}
    </Box>
  );
}

function UserIdentity({ user }) {
  const name = getDisplayName(user);
  const roleKey = getRoleKey(user);
  const tone = getRoleTone(user);

  return (
    <HStack gap={SP.md} align="center" minW="0">
      <UserAvatar name={name} tone={tone} />

      <VStack gap={SP["2xs"]} align="flex-start" minW="0">
        <Text
          fontSize={FS.body}
          fontWeight="600"
          fontFamily={SANS}
          color={P.black}
          lineHeight="1.2"
          letterSpacing="-0.005em"
          maxW={H.nameMax}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={name}
        >
          {name}
        </Text>

        <RoleBadge role={roleKey} />
      </VStack>
    </HStack>
  );
}

function SegmentedDivider({ height = H.divider, ...rest }) {
  return (
    <VStack
      h={height}
      gap={SP.sm}
      align="center"
      justify="center"
      flexShrink={0}
      aria-hidden="true"
      {...rest}
    >
      <Box w="1px" h="4px" bg={P.ink200} />
      <Box w="1px" h="4px" bg={P.ink200} />
      <Box w="1px" h="4px" bg={P.ink200} />
    </VStack>
  );
}

function LogoutButton({ onClick, ...rest }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      h={H.logout}
      px={SP.lg}
      fontSize={FS.tiny}
      fontWeight="700"
      fontFamily={MONO}
      textTransform="uppercase"
      letterSpacing="0.08em"
      lineHeight="1"
      borderRadius={RADII.md}
      borderWidth="1px"
      borderColor={P.ink200}
      color={P.ink600}
      bg={P.white}
      flexShrink={0}
      transition="background-color 120ms ease, border-color 120ms ease, color 120ms ease"
      _hover={{
        bg: P.blue50,
        borderColor: P.blue200,
        color: P.blue,
        "& .logout-arrow": { transform: "translateX(2px)" },
      }}
      _active={{ bg: P.blue100, borderColor: P.blue200, color: P.blueActive }}
      _focusVisible={FOCUS_BLUE}
      {...rest}
    >
      <Box as="span" display="inline-flex" alignItems="center">
        Logout
        <Box
          as="span"
          className="logout-arrow"
          ml="6px"
          display="inline-block"
          lineHeight="1"
          transition="transform 140ms ease"
        >
          →
        </Box>
      </Box>
    </Button>
  );
}

function UserMenuContent({ user, onLogout }) {
  return (
    <HStack gap={SP.lg} align="center" role="group" aria-label="User menu">
      <UserIdentity user={user} />
      <SegmentedDivider />
      <LogoutButton onClick={onLogout} />
    </HStack>
  );
}

export default function UserMenu() {
  const { user, logout, openLogin } = useAuth();
  if (!user) {
    return (
      <Button
        onClick={openLogin}
        h={H.logout}
        px={SP.lg}
        fontSize={FS.tiny}
        fontWeight="700"
        fontFamily={MONO}
        textTransform="uppercase"
        letterSpacing="0.08em"
        lineHeight="1"
        borderRadius={RADII.md}
        bg={P.blue}
        color="#FFFFFF"
        flexShrink={0}
        _hover={{ bg: P.blueActive }}
        _focusVisible={FOCUS_BLUE}
      >
        Login
      </Button>
    );
  }
  return <UserMenuContent user={user} onLogout={logout} />;
}
