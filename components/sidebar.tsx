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
      <div className="brand">
        <div className="brand-mark">S</div>
        <div>
          <h1 className="brand-title">Signal Desk</h1>
          <p className="brand-subtitle">Personal dashboard</p>
        </div>
      </div>

      <p className="nav-label">Views</p>
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
