import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppNav from "@/components/layout/AppNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
        {/* Brand */}
        <div className="flex flex-col gap-1 px-4 py-5">
          <span className="text-sm font-semibold tracking-tight text-white">
            AesthetiQ CRM
          </span>
          <Badge
            variant="outline"
            className="w-fit border-zinc-700 px-1.5 py-0 text-[10px] text-zinc-400"
          >
            Demo Clinic
          </Badge>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Nav */}
        <div className="flex-1 py-4">
          <AppNav />
        </div>

        <Separator className="bg-zinc-800" />

        {/* User placeholder */}
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-zinc-700 text-xs text-zinc-400">
              ?
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-zinc-500">Staff</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
