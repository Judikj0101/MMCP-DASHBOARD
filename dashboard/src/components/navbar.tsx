"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, BarChart, AlertTriangle, Settings, Globe } from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: Globe },
  { href: "/markets", label: "Markets", icon: BarChart },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/system", label: "System", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wider text-primary">
          <Activity className="h-5 w-5" />
          MMCP
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
