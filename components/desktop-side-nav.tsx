"use client";

import type React from "react";
import Link from "next/link";
import {
  Home, Compass, PlusCircle, Bell, User
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href} legacyBehavior passHref>
      <a
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors duration-200 
          ${isActive 
            ? "bg-highlight/10 text-highlight font-semibold" 
            : "text-muted-foreground hover:bg-paper-dark hover:text-ink"}
        `}
        aria-label={label}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

interface DesktopSideNavProps {
  activeTab: string;
  onTabClick: (tabName: string) => void;
  className?: string;
}

export default function DesktopSideNav({ activeTab, onTabClick, className }: DesktopSideNavProps) {
  const navItems = [
    { name: "homeTab", href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
    { name: "discoverTab", href: "/discover", label: "Discover", icon: <Compass className="h-5 w-5" /> },
    { name: "createTab", href: "/create", label: "Create", icon: <PlusCircle className="h-5 w-5" /> },
    { name: "notificationsTab", href: "/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { name: "profileTab", href: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <nav className={`flex flex-col space-y-1 p-4 bg-paper border-r border-border ${className || ''}`}>
      <div className="mb-4 px-4">
        <Link href="/" legacyBehavior passHref>
          <a className="text-2xl font-bold text-ink hover:text-highlight transition-colors">
            GoodStories
          </a>
        </Link>
      </div>
      {navItems.map((item) => (
        <NavItem
          key={item.name}
          href={item.href} // Actual navigation will be handled by parent for now, or via router if these become direct links
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.name}
          onClick={() => onTabClick(item.name)}
        />
      ))}
    </nav>
  );
} 