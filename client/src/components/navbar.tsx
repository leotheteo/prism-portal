import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation, isLoading } = useAuth();

  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container h-full flex items-center justify-between">
          <h1 className="text-xl font-semibold">Prism Audio Artist Portal</h1>
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
      <div className="container h-full flex items-center justify-between">
        <Link href="/">
          <h1 className="text-xl font-semibold cursor-pointer">Prism Audio Artist Portal</h1>
        </Link>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              {user.isTeamMember && (
                <Link href="/team">
                  <Button variant="ghost">Team Portal</Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button variant="outline">Team Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
