import { useQuery, useMutation } from "@tanstack/react-query";
import type { Submission, FAQ } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { SubmissionDetails } from "@/components/submission-details"; // Added import
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal } from 'lucide-react';


export default function TeamPortal() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  console.log("Current user:", user); // Debug log

  const { data: submissions, isLoading: isLoadingSubmissions, onError } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
    onError: (error) => {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    },
  });

  console.log("Fetched submissions:", submissions); // Debug log

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "declined";
    }) => {
      await apiRequest("POST", `/api/submissions/${id}/review`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Success",
        description: "Submission status updated",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Success", description: "Logged out successfully" });
    },
  });

  if (!user || user.role !== "team") {
    console.log("User not authenticated or not team member"); // Debug log
    return null;
  }

  if (isLoadingSubmissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const handleLogout = () => logoutMutation.mutate();


  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Team Portal</h1>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Logout
          </Button>
        </div>

        <Card className="overflow-hidden"> {/* Added overflow-hidden */}
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Music Submissions</CardTitle>
              <CardDescription>
                Review and manage artist submissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                Logged in as {user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="card-content"> {/* Added card-content */}
            {submissions && submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {format(new Date(submission.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{submission.artistName}</TableCell>
                      <TableCell className="capitalize">
                        {submission.releaseType}
                      </TableCell>
                      <TableCell>{submission.genre}</TableCell>
                      <TableCell className="capitalize">
                        {submission.status}
                      </TableCell>
                      <TableCell>
                        {submission.featuredArtist ? (
                          <span className="px-2 py-1 bg-slate-100 text-xs rounded-full">
                            Feat. Artist
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            View Details
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => reviewMutation.mutate({
                                  id: submission.id,
                                  status: "approved",
                                })}
                                disabled={submission.status !== "pending"}
                              >
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => reviewMutation.mutate({
                                  id: submission.id,
                                  status: "declined",
                                })}
                                disabled={submission.status !== "pending"}
                              >
                                Decline
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No submissions found
              </div>
            )}
          </CardContent>
        </Card>
        {selectedSubmission && <SubmissionDetails submission={selectedSubmission} />}
      </div>
    </div>
  );
}