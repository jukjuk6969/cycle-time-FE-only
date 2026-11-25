/**
 * LoginPage.jsx
 * Dashboard login page. Powered by the Astra Visteon theme.
 * Warna permukaan mengikuti token --ct-* (light/dark otomatis).
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";

import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

const KEYFRAMES = `
@keyframes lp-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lp-slide {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes lp-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes lp-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
@keyframes lp-scan {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
@keyframes lp-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
}
`;

// Aksen merek yang tidak berubah antar tema.
const BRAND_ORANGE = "#F58025";
const STATUS_GREEN = "#10B981";
const ON_BRAND = "#FFFFFF"; // teks di atas tombol oranye (tidak berubah)

const SANS = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
const MONO = `"JetBrains Mono", "SF Mono", ui-monospace, "Cascadia Code", Consolas, monospace`;

export default function LoginPage() {
  const { login, closeLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const errorRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !username.trim() || !password) return;
    setBusy(true);
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.response
            ? `Login failed (${err.response.status})`
            : "Server is unreachable."),
      );
      setPassword("");
      setBusy(false);
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const disabled = busy || !username.trim() || !password;

  const inputStyles = {
    size: "lg",
    h: "48px",
    borderRadius: "4px",
    bg: "var(--ct-canvas)",
    border: "1px solid",
    borderColor: "var(--ct-ink-200)",
    px: "4",
    fontFamily: MONO,
    fontSize: "14px",
    color: "var(--ct-black)",
    letterSpacing: "0.02em",
    _placeholder: { color: "var(--ct-ink-400)" },
    _hover: { borderColor: "var(--ct-ink-300)" },
    transition:
      "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease, color 160ms ease",
    _focus: {
      outline: "none",
      bg: "var(--ct-surface)",
      borderColor: "var(--ct-blue)",
      boxShadow: "0 0 0 3px rgba(var(--ct-blue-rgb), .18)",
    },
  };

  return (
    <Flex
      minH="100vh"
      bg="var(--ct-surface)"
      overflow="hidden"
      fontFamily={SANS}
    >
      <style>{KEYFRAMES}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* ================= LEFT PANEL ================= */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flex="1"
        position="relative"
        bg="var(--ct-brand-panel)"
        color="var(--ct-brand-ink)"
        borderRight="1px solid var(--ct-brand-divider)"
        overflow="hidden"
        style={{ animation: "lp-slide 700ms cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Blueprint grid */}
        <Box
          aria-hidden
          position="absolute"
          inset="0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--ct-lp-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--ct-lp-grid) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Sweeping arcs */}
        <Box
          aria-hidden
          position="absolute"
          top="50%"
          left="-10%"
          transform="translateY(-50%)"
          w="120%"
          h="600px"
          pointerEvents="none"
        >
          <Box
            position="absolute"
            top="20%"
            left="0"
            w="100%"
            h="150px"
            borderTop="2px solid"
            borderColor="var(--ct-lp-arc-warm)"
            borderRadius="50%"
            transform="rotate(-8deg)"
            opacity="0.6"
          />
          <Box
            position="absolute"
            top="30%"
            left="0"
            w="100%"
            h="200px"
            borderTop="4px solid"
            borderColor="var(--ct-lp-arc-cool)"
            borderRadius="50%"
            transform="rotate(-5deg)"
            opacity="0.4"
          />
        </Box>

        {/* Glow */}
        <Box
          aria-hidden
          position="absolute"
          top="25%"
          left="10%"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="radial-gradient(circle, var(--ct-lp-glow) 0%, transparent 70%)"
          pointerEvents="none"
        />

        <Flex
          position="relative"
          direction="column"
          justify="space-between"
          p="10"
          w="100%"
          zIndex="1"
        >
          <HStack
            justify="space-between"
            align="center"
            pb="4"
            borderBottom="1px solid var(--ct-brand-divider)"
            style={{ animation: "lp-fade 600ms ease 200ms both" }}
          >
            <HStack gap="3">
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={STATUS_GREEN}
                boxShadow={`0 0 12px ${STATUS_GREEN}`}
                style={{ animation: "lp-blink 2.4s ease-in-out infinite" }}
              />
              <Text
                fontSize="11px"
                fontWeight="600"
                letterSpacing="0.2em"
                color="var(--ct-brand-ink)"
                fontFamily={MONO}
              >
                ASTRA VISTEON INDONESIA
              </Text>
            </HStack>
            <HStack
              gap="2"
              fontSize="10px"
              color="var(--ct-brand-ink-soft)"
              fontFamily={MONO}
              letterSpacing="0.14em"
            >
              <Text>SYS · ONLINE</Text>
              <Text color="var(--ct-brand-divider)">|</Text>
              <Text>v2.4</Text>
            </HStack>
          </HStack>

          <Box
            style={{ animation: "lp-fade 800ms ease 350ms both" }}
            maxW="560px"
          >
            <HStack gap="2" mb="5">
              <Box w="14px" h="2px" bg={BRAND_ORANGE} />
              <Text
                fontSize="11px"
                letterSpacing="0.24em"
                color={BRAND_ORANGE}
                fontWeight="600"
                fontFamily={MONO}
              >
                MANUFACTURING OPERATIONS
              </Text>
            </HStack>

            <Text
              fontSize={{ base: "40px", xl: "54px" }}
              lineHeight="1.05"
              fontWeight="700"
              letterSpacing="-0.02em"
              color="var(--ct-brand-ink)"
              fontFamily={SANS}
            >
              Precision in
              <br />
              every cycle.
              <br />
              <Text as="span" color={BRAND_ORANGE}>
                —————
              </Text>
            </Text>

            <Text
              fontSize="14.5px"
              color="var(--ct-brand-ink-muted)"
              mt="6"
              maxW="420px"
              lineHeight="1.7"
            >
              Centralized monitoring system for Astra Visteon Indonesia
              production lines. Monitor cycle times, workstation efficiency, and
              machine status in real time.
            </Text>

            <Box
              mt="10"
              pt="6"
              borderTop="1px dashed var(--ct-brand-divider-dash)"
              style={{ animation: "lp-fade 800ms ease 600ms both" }}
            >
              <Text
                fontSize="10px"
                letterSpacing="0.16em"
                color="var(--ct-brand-ink-faint)"
                fontFamily={MONO}
                mb="3"
              >
                SYSTEM CAPABILITIES
              </Text>
              <VStack align="flex-start" gap="2.5">
                {[
                  "Real-time cycle time tracking per station",
                  "Live video feed for operator monitoring",
                  "Secure access with role-based permissions",
                ].map((item) => (
                  <HStack key={item} gap="3">
                    <Box w="4px" h="4px" bg={BRAND_ORANGE} />
                    <Text
                      fontSize="12.5px"
                      color="var(--ct-brand-ink-muted)"
                      fontFamily={SANS}
                    >
                      {item}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </Box>

          <HStack
            justify="space-between"
            pt="4"
            borderTop="1px solid var(--ct-brand-divider)"
            fontSize="10px"
            letterSpacing="0.16em"
            color="var(--ct-brand-ink-faint)"
            fontFamily={MONO}
            style={{ animation: "lp-fade 700ms ease 750ms both" }}
          >
            <Text>© {new Date().getFullYear()} ASTRA VISTEON INDONESIA</Text>
            <Text>SHIFT · LOGGED</Text>
            <Text>RESTRICTED ACCESS</Text>
          </HStack>
        </Flex>
      </Box>

      {/* ================= RIGHT PANEL ================= */}
      <Flex
        flex={{ base: "1", lg: "0 0 480px" }}
        align="center"
        justify="center"
        bg="var(--ct-surface)"
        px={{ base: "6", md: "14" }}
        position="relative"
      >
        <Box position="absolute" top="16px" right="16px" zIndex={2}>
          <ThemeToggle />
        </Box>

        {/* Top scanline */}
        <Box
          aria-hidden
          display={{ base: "none", lg: "block" }}
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="2px"
          overflow="hidden"
        >
          <Box
            w="40%"
            h="100%"
            bg={`linear-gradient(to right, transparent, ${BRAND_ORANGE}, transparent)`}
            style={{ animation: "lp-scan 5s ease-in-out infinite" }}
          />
        </Box>

        <Box
          as="form"
          onSubmit={submit}
          w="100%"
          maxW="360px"
          style={{
            animation: `lp-rise 600ms cubic-bezier(0.22,1,0.36,1) 150ms both, ${
              shake ? "lp-shake 400ms ease" : "none"
            }`,
          }}
        >
          <VStack gap="8" align="stretch">
            <Box>
              <HStack gap="2" mb="4">
                <Box w="8px" h="8px" bg="var(--ct-blue)" />
                <Text
                  fontSize="10.5px"
                  letterSpacing="0.2em"
                  color="var(--ct-blue)"
                  fontWeight="700"
                  fontFamily={MONO}
                >
                  LOGIN PORTAL
                </Text>
              </HStack>
              <Text
                fontSize="32px"
                fontWeight="700"
                color="var(--ct-black)"
                letterSpacing="-0.03em"
                fontFamily={SANS}
                lineHeight="1.1"
              >
                Welcome
              </Text>
              <Text
                fontSize="14px"
                color="var(--ct-ink-500)"
                mt="2"
                lineHeight="1.6"
              >
                Authentication is required to access the manufacturing
                dashboard.
              </Text>
            </Box>

            <Box h="1px" bg="var(--ct-ink-200)" />

            <Box>
              <HStack justify="space-between" mb="2">
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.16em"
                  color="var(--ct-black)"
                  fontFamily={MONO}
                >
                  USERNAME
                </Text>
                <Text
                  fontSize="10px"
                  color="var(--ct-ink-400)"
                  fontFamily={MONO}
                  letterSpacing="0.1em"
                >
                  REQUIRED
                </Text>
              </HStack>
              <Input
                {...inputStyles}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={busy}
                placeholder="AV-0000"
              />
            </Box>

            <Box>
              <HStack justify="space-between" mb="2">
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.16em"
                  color="var(--ct-black)"
                  fontFamily={MONO}
                >
                  PASSWORD
                </Text>
                <Text
                  fontSize="10px"
                  color="var(--ct-ink-400)"
                  fontFamily={MONO}
                  letterSpacing="0.1em"
                >
                  ENCRYPTED
                </Text>
              </HStack>
              <Input
                {...inputStyles}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                placeholder="••••••••"
              />
            </Box>

            {error && (
              <Box
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                border="1px solid"
                borderColor="var(--ct-red)"
                bg="var(--ct-red-50)"
                borderRadius="4px"
                px="4"
                py="3"
                style={{ animation: "lp-fade 220ms ease both" }}
              >
                <HStack gap="2.5" align="flex-start">
                  <Box
                    mt="6px"
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="var(--ct-red)"
                    flexShrink="0"
                  />
                  <Text
                    fontSize="13px"
                    color="var(--ct-red-text)"
                    fontFamily={SANS}
                    fontWeight="500"
                    lineHeight="1.5"
                  >
                    {error}
                  </Text>
                </HStack>
              </Box>
            )}

            <Button
              type="submit"
              disabled={disabled}
              h="50px"
              borderRadius="4px"
              bg={BRAND_ORANGE}
              color={ON_BRAND}
              fontWeight="700"
              fontSize="13px"
              letterSpacing="0.15em"
              fontFamily={MONO}
              textTransform="uppercase"
              transition="background-color 160ms ease, transform 120ms ease, opacity 160ms ease, box-shadow 200ms ease"
              _hover={
                !disabled
                  ? {
                      bg: "#E6731A",
                      boxShadow: `0 6px 20px -8px ${BRAND_ORANGE}80`,
                    }
                  : undefined
              }
              _active={!disabled ? { transform: "translateY(1px)" } : undefined}
              _disabled={{
                opacity: 0.5,
                cursor: "not-allowed",
                bg: "var(--ct-ink-300)",
              }}
            >
              {busy ? "AUTHENTICATING..." : "SIGN IN TO SYSTEM"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={closeLogin}
              disabled={busy}
              h="44px"
              borderRadius="4px"
              borderColor="var(--ct-ink-200)"
              color="var(--ct-ink-600)"
              bg="transparent"
              fontWeight="600"
              fontSize="12px"
              letterSpacing="0.12em"
              fontFamily={MONO}
              textTransform="uppercase"
              _hover={{
                bg: "var(--ct-blue-50)",
                borderColor: "var(--ct-blue-200)",
                color: "var(--ct-blue)",
              }}
            >
              Continue as Viewer
            </Button>
            <Box pt="2" borderTop="1px solid var(--ct-ink-200)">
              <Text
                fontSize="11px"
                color="var(--ct-ink-400)"
                textAlign="center"
                lineHeight="1.6"
                fontFamily={SANS}
              >
                Restricted access for authorized Astra Visteon Indonesia
                personnel.
                <br />
                All activities are recorded in the system audit log.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Flex>
    </Flex>
  );
}
