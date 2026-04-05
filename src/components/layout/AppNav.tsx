"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Pipeline",
    href: "/",
    icon: LayoutGrid,
    disabled: false,
  },
  {
    label: "Analytics",
    href: "#",
    icon: BarChart2,
    disabled: true,
    hint: "Coming in Phase 5",
  },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.disabled && pathname === item.href;

        const inner = (
          <div
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              item.disabled && "pointer-events-none opacity-40"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-[10px] font-normal text-gray-400">
                Phase 5
              </span>
            )}
          </div>
        );

        if (item.disabled) {
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger className="block w-full border-0 bg-transparent p-0 text-left">
                {inner}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.hint}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link key={item.label} href={item.href}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
