import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Star, LayoutDashboard, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl"
            data-testid="link-home"
          >
            <span className="text-primary">Fund</span>
            <span>Match</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/marketplace"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/marketplace" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="link-marketplace"
            >
              <Store className="inline-block w-4 h-4 mr-1" />
              Marketplace
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === "/" ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid="link-dashboard"
                >
                  <LayoutDashboard className="inline-block w-4 h-4 mr-1" />
                  Dashboard
                </Link>
                <Link
                  href="/saved"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === "/saved" ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid="link-saved"
                >
                  <Star className="inline-block w-4 h-4 mr-1" />
                  Saved
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" data-testid="text-username">{user?.firstName || user?.email || "User"}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
