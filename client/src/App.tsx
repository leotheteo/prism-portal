import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import SubmissionForm from "@/pages/submission-form";
import TeamPortal from "@/pages/team-portal";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import Navbar from "@/components/navbar";
import ReleaseInfo from "@/pages/release-info"; // Import the new component


function Router() {
  return (
    <Switch>
      <Route path="/" component={SubmissionForm} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/team" component={TeamPortal} />
      <ProtectedRoute path="/release/:id" component={ReleaseInfo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-16">
            <Router />
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;