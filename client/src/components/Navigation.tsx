import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Ticket, Sun, Moon, Settings, Users } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isHome = location === "/" || location.startsWith("/booking");
  const isAdminPage = location === "/admin";

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-full items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold" data-testid="text-app-title">
            TicketFlow
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={isHome ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-shows"
            >
              <Users className="mr-2 h-4 w-4" />
              Shows
            </Button>
          </Link>
          <Link href="/admin">
            <Button
              variant={isAdminPage ? "secondary" : "ghost"}
              size="sm"
              data-testid="link-admin"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
