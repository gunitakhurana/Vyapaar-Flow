"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  phone: string;
  role: "wholesaler" | "retailer" | "admin";
  business_name: string;
  gst_number: string | null;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Ignore lock-steal errors that occur during multi-tab auth transitions
      if (!error.message.includes("was released because another request stole it")) {
        console.error("Error fetching profile:", error.message);
      }
      return;
    }
    setProfile(data);
  };

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth.
    // It fires immediately with the current session (INITIAL_SESSION event),
    // so we don't need a separate getSession() call — which would race for
    // the same storage lock and cause "lock stolen" errors in multi-tab setups.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Try to load the profile row
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error && !error.message.includes("was released because another request stole it")) {
          console.error("Error fetching profile:", error.message);
        }

        if (data) {
          // Profile already exists — just use it
          setProfile(data);
        } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          // Profile missing — this happens when a new user confirms their email,
          // or if the profile row was accidentally deleted.
          // The signup page stored role & business_name in user_metadata.
          const meta = session.user.user_metadata as {
            role?: "wholesaler" | "retailer" | "admin";
            business_name?: string;
            phone?: string;
            gst_number?: string;
          };

          if (meta?.role) {
            const phoneValue = meta.phone?.trim() ? meta.phone.trim() : null;
            const { data: newProfile, error: insertError } = await supabase
              .from("users")
              .upsert({
                id: session.user.id,
                role: meta.role,
                business_name: meta.business_name ?? "",
                phone: phoneValue,
                gst_number: meta.gst_number ?? null,
              })
              .select()
              .single();

            if (insertError) {
              if (insertError.message.includes("users_phone_unique_idx")) {
                // Fallback for conflicting phone numbers (often happens during dev testing)
                // Try to extract phone from email if metadata is missing
                const emailPhone = session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 5)}`;
                
                const { data: fallbackProfile, error: fallbackError } = await supabase
                  .from("users")
                  .upsert({
                    id: session.user.id,
                    role: meta.role,
                    business_name: meta.business_name ?? "",
                    phone: emailPhone, // Use extracted phone instead of null
                    gst_number: meta.gst_number ?? null,
                  })
                  .select()
                  .single();
                  
                if (fallbackError) {
                  console.error("Fallback profile creation failed:", fallbackError.message);
                } else {
                  setProfile(fallbackProfile);
                }
              } else {
                console.error("Error creating profile:", insertError.message);
              }
            } else {
              setProfile(newProfile);
            }
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
