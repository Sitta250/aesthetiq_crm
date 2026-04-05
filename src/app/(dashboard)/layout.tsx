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
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Brand */}
        <div className="flex flex-col gap-1 px-4 py-5">
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            AesthetiQ CRM
          </span>
          <Badge
            variant="outline"
            className="w-fit border-gray-300 px-1.5 py-0 text-[10px] text-gray-500"
          >
            Demo Clinic
          </Badge>
        </div>

        <Separator className="bg-gray-200" />

        {/* Nav */}
        <div className="flex-1 py-4">
          <AppNav />
        </div>

        <Separator className="bg-gray-200" />

        {/* User placeholder */}
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gray-200 text-xs text-gray-500">
              ?
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500">Staff</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
