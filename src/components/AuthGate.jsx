/**
 * AuthGate.jsx
 * Menampilkan children hanya bila sudah login; selain itu halaman login.
 * Layar verifikasi ditahan minimal MIN_LOADING_MS sejak mount.
 */
import { useEffect, useState } from "react";
import { Flex, HStack, VStack, Text, Box, Image } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useThemeMode } from "../hooks/useThemeMode";
import LoginPage from "./LoginPage";
import logoGif from "../assets/logo.png";

const MONO = `"JetBrains Mono", "SF Mono", ui-monospace, monospace`;
const SANS = `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

// Golden ratio (detik -> ms). Minimum display time layar verifikasi.
const MIN_LOADING_MS = 618;

const LOADING_KEYFRAMES = `
@keyframes authgate-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}
@media (prefers-reduced-motion: reduce) {
  .authgate-dot { animation: none !important; }
}
`;

export default function AuthGate({ children }) {
  const { loading, loginOpen } = useAuth();
  const { mode } = useThemeMode();
  const dark = mode === "dark";

  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  const showLoading = loading || !minElapsed;

  if (showLoading) {
    return (
      <>
        <style>{LOADING_KEYFRAMES}</style>
        <Flex
          minH="100vh"
          align="center"
          justify="center"
          bg="var(--ct-canvas)"
          direction="column"
          gap={6}
          role="status"
          aria-live="polite"
          aria-label="Verifying session"
        >
          {dark ? (
            <VStack gap="2px" align="center">
              <Text
                fontSize="15px"
                fontWeight="800"
                color="var(--ct-black)"
                letterSpacing="-0.01em"
                lineHeight="1.1"
                fontFamily={SANS}
              >
                Astra Visteon
              </Text>
              <Text
                fontSize="11px"
                fontWeight="600"
                color="var(--ct-black)"
                letterSpacing="0.32em"
                lineHeight="1.2"
                fontFamily={SANS}
              >
                INDONESIA
              </Text>
            </VStack>
          ) : (
            <Image
              src={logoGif}
              alt="Astra Visteon Indonesia"
              h="40px"
              w="auto"
              objectFit="contain"
            />
          )}

          <HStack gap="10px" align="center">
            <Box
              className="authgate-dot"
              w="6px"
              h="6px"
              bg="var(--ct-orange-strong)"
              borderRadius="full"
              aria-hidden="true"
              style={{
                animation: "authgate-blink 0.618s ease-in-out infinite",
              }}
            />
            <Text
              fontFamily={MONO}
              fontSize="11px"
              color="var(--ct-ink-500)"
              letterSpacing="0.14em"
            >
              VERIFYING SESSION...
            </Text>
          </HStack>
        </Flex>
      </>
    );
  }

  return (
    <>
      {children}
      {loginOpen && (
        <Box
          position="fixed"
          inset="0"
          zIndex={2000}
          overflowY="auto"
          bg="var(--ct-surface)"
        >
          <LoginPage />
        </Box>
      )}
    </>
  );
}
