import { useState } from "react";
import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import TodayPage from "@/pages/today";
import LogPage from "@/pages/log";
import TrendsPage from "@/pages/trends";
import SettingsPage from "@/pages/settings";
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Settings,
  Sun,
  Moon,
  Dumbbell,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Today", icon: LayoutDashboard },
  { path: "/log", label: "Log", icon: ClipboardList },
  { path: "/trends", label: "Trends", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Sidebar({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b bg-sidebar">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Fitness Companion</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="mobile-menu-btn"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-sidebar border-b p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${
                  location === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 border-r bg-sidebar h-screen fixed left-0 top-0" data-testid="sidebar">
        <div className="p-4 border-b flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Fitness Companion</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${
                  location === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setDarkMode(!darkMode)}
            data-testid="dark-mode-toggle"
          >
            {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </aside>
    </>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={TodayPage} />
      <Route path="/log" component={LogPage} />
      <Route path="/trends" component={TrendsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={darkMode ? "dark" : ""}>
          <div className="min-h-screen bg-background text-foreground">
            <Router hook={useHashLocation}>
              <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
              <main className="md:ml-52 p-4 md:p-6 pb-20">
                <AppRouter />
                <PerplexityAttribution />
              </main>
            </Router>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
