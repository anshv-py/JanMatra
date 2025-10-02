'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartBar as BarChart3, FileText, TrendingUp, Settings, Chrome as Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [reportCount, setReportCount] = useState<number | null>(null);

  // ✅ Fetch report count on mount
  useEffect(() => {
    const fetchReportCount = async () => {
      try {
        const res = await fetch('http://localhost:8000/sources/');
        const data = await res.json();
        const titles = data?.available_source_titles || [];
        setReportCount(titles.length);
      } catch (err) {
        console.error("❌ Error fetching report count:", err);
        setReportCount(null);
      }
    };

    fetchReportCount();

    // Optional: auto-refresh every 60s
    const interval = setInterval(fetchReportCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
    { id: 'reports', label: 'Reports', icon: FileText, badge: reportCount !== null ? reportCount.toString() : '...' },
    { id: 'analysis', label: 'Analysis', icon: TrendingUp, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">JanMatra</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-10",
                collapsed && "justify-center px-0",
                isActive && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant={isActive ? "secondary" : "outline"} className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">Version 1.0.0</div>
        </div>
      )}
    </div>
  );
}
