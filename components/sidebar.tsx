"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, LayoutDashboard } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Dev Signals", href: "/dev-signals", icon: Github },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-copy">
              <Icon size={16} />
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
