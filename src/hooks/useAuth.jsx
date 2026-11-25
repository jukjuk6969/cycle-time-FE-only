/**
 * useAuth.jsx
 * Sesi login dashboard (cookie HttpOnly dari server). Bungkus <App /> dengan <AuthProvider>.
 *
 * - Tanpa login = tamu (role "viewer"): dashboard bisa dilihat, aksi ubah/hapus ditolak server.
 * - Tombol Login memanggil openLogin() -> tampilkan dialog login (loginOpen === true).
 * - axios.defaults.withCredentials = true  -> semua axios di project otomatis kirim cookie sesi.
 * - Respons 401 AUTH_REQUIRED (aksi admin tanpa sesi / sesi habis) -> user jadi tamu + dialog login terbuka.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

import { BASE_URL } from "../config";

axios.defaults.withCredentials = true;

const NOT_READY = {
  user: null,
  role: "viewer",
  loading: false,
  isAdmin: false,
  isGuest: true,
  loginOpen: false,
  openLogin: () => {},
  closeLogin: () => {},
  login: async () => {},
  logout: async () => {},
};
const AuthCtx = createContext(NOT_READY);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = sedang cek sesi, null = tamu
  const [loginOpen, setLoginOpen] = useState(false);

  // cek sesi yang masih berlaku (mis. setelah refresh halaman)
  useEffect(() => {
    let alive = true;
    axios
      .get(`${BASE_URL}/api/auth/me`)
      .then((r) => alive && setUser(r.data.user))
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, []);

  // aksi admin ditolak (tamu) atau sesi habis di tengah pemakaian
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (r) => r,
      (err) => {
        const url = String(err.config?.url || "");
        if (
          err.response?.status === 401 &&
          err.response.data?.code === "AUTH_REQUIRED" &&
          !url.includes("/api/auth/")
        ) {
          setUser(null);
          setLoginOpen(true);
        }
        return Promise.reject(err);
      },
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const login = useCallback(async (username, password) => {
    const r = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password,
    });
    setUser(r.data.user);
    setLoginOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user: user ?? null,
      role: user?.role ?? "viewer",
      loading: user === undefined,
      isAdmin: user?.role === "admin",
      isGuest: !user,
      loginOpen,
      openLogin,
      closeLogin,
      login,
      logout,
    }),
    [user, loginOpen, openLogin, closeLogin, login, logout],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
