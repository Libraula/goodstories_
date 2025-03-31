"use client"

import type React from "react"

interface SidebarNavItemProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  isCollapsed: boolean
}

export default function SidebarNavItem({ icon, label, isActive, onClick, isCollapsed }: SidebarNavItemProps) {
  return (
    <a
      href="#"
      className={`sidebar-nav-item flex items-center px-4 py-3 my-1 mx-2 rounded-lg transition-colors duration-300 ${
        isActive
          ? "bg-highlight/10 text-highlight dark:text-highlight"
          : "text-ink-light dark:text-ink-light hover:bg-paper-dark/10 dark:hover:bg-paper/10 hover:text-ink dark:hover:text-ink"
      }`}
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
    >
      <div className="flex-shrink-0">{icon}</div>
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </a>
  )
}

