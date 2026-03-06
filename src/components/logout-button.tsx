"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refresh server components to catch new auth state
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}
