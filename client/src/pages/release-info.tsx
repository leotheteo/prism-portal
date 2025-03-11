import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Trash2, Music4 } from "lucide-react";
import { Submission } from "@shared/schema";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReleaseInfo() {
  const { id } = useParams();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ type: 'artwork' | 'audio', index?: number } | null>(null);

  const { data: submission, isLoading } = useQuery<Submission>({
    queryKey: [`/api/submissions/${id}`],
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, index }: { type: 'artwork' | 'audio', index?: number }) => {
      await apiRequest("DELETE", `/api/submissions/${id}/files`, { type, index });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/${id}`] });
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return <div>Submission not found</div>;
  }

  const handleDelete = (type: 'artwork' | 'audio', index?: number) => {
    setFileToDelete({ type, index });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Release Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Artist Information</h3>
                <p>Artist: {submission.artistName}</p>
                <p>Email: {submission.email}</p>
                <p>Writer/Composer: {submission.writerComposer}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Release Information</h3>
                <p>Type: {submission.releaseType}</p>
                <p>Title: {submission.releaseTitle}</p>
                <p>Genre: {submission.genre}</p>
                <p>Language: {submission.language}</p>
                <p>Release Date: {new Date(submission.releaseDate).toLocaleDateString()}</p>
              </div>
            </div>

            {submission.artworkUrl && (
              <div>
                <h3 className="font-semibold mb-2">Artwork</h3>
                <div className="flex items-center gap-4">
                  <img 
                    src={submission.artworkUrl} 
                    alt="Release artwork" 
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.open(submission.artworkUrl!)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete('artwork')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Tracks</h3>
              <div className="space-y-4">
                {submission.tracks.map((track, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{track.title}</h4>
                          {track.version && <p className="text-sm">Version: {track.version}</p>}
                          {track.featuredArtist && (
                            <p className="text-sm">Featured: {track.featuredArtist}</p>
                          )}
                        </div>
                        {track.audioFile.url && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => window.open(track.audioFile.url)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDelete('audio', index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {submission.previouslyReleased && (
              <div>
                <h3 className="font-semibold mb-2">Previous Release Information</h3>
                <p>UPC: {submission.previousUpc}</p>
                <p>ISRC: {submission.previousIsrc}</p>
              </div>
            )}

            {submission.featuredArtist && (
              <div>
                <h3 className="font-semibold mb-2">Featured Artist Information</h3>
                <p>Artist: {submission.featuredArtist}</p>
                {submission.featuredArtistType === 'existing' && submission.featuredArtistProfiles && (
                  <div className="mt-2">
                    <p>Profiles:</p>
                    <ul className="list-disc pl-5">
                      {submission.featuredArtistProfiles.spotify && (
                        <li>
                          <a 
                            href={submission.featuredArtistProfiles.spotify} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Spotify
                          </a>
                        </li>
                      )}
                      {submission.featuredArtistProfiles.appleMusic && (
                        <li>
                          <a 
                            href={submission.featuredArtistProfiles.appleMusic} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Apple Music
                          </a>
                        </li>
                      )}
                      {submission.featuredArtistProfiles.youtube && (
                        <li>
                          <a 
                            href={submission.featuredArtistProfiles.youtube} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            YouTube
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}