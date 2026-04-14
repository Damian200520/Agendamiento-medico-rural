import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  getCurrentSession,
  onAuthStateChange,
  signOut,
} from "../services/authService";
import { getProfileById } from "../services/profileService";
import type { Profile } from "../types/profile";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      try {
        setLoading(true);

        const { data, error } = await getCurrentSession();

        if (error) {
          console.error("Error obteniendo sesión:", error.message);
          if (!mounted) return;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const sessionUser = data.session?.user ?? null;

        if (!mounted) return;
        setUser(sessionUser);
      } catch (error) {
        console.error("Error inesperado cargando sesión:", error);
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    loadInitialSession();

    const {
      data: { subscription },
    } = onAuthStateChange(async(_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await getProfileById(user.id);

        if (!mounted) return;

        if (error) {
          console.error("Error cargando perfil:", error.message);
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(data ?? null);
        setLoading(false);
      } catch (error) {
        console.error("Error inesperado cargando perfil:", error);
        if (!mounted) return;
        setProfile(null);
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function logout() {
    await signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      logout,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}