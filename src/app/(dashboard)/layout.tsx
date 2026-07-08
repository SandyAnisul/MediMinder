import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold text-zinc-900">MediMinder</span>
        <form action={logout} className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user.email}</span>
          <button
            type="submit"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Sign out
          </button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
