
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Download, Trash2 } from "lucide-react";
import type { Submission } from "@shared/schema";

interface SubmissionDetailsProps {
  submission: Submission;
  onClose: () => void;
}

export function SubmissionDetails({ submission, onClose }: SubmissionDetailsProps) {
  const queryClient = useQueryClient();
  const [isDeleteTrackDialogOpen, setIsDeleteTrackDialogOpen] = useState(false);
  const [isDeleteArtworkDialogOpen, setIsDeleteArtworkDialogOpen] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackIndex: number) => {
      const res = await fetch(`/api/submissions/${submission.id}/tracks/${trackIndex}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete track");
      }
    },
    onSuccess: () => {
      toast({
        title: "Track deleted",
        description: "The track has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete track: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteArtworkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/submissions/${submission.id}/artwork`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete artwork");
      }
    },
    onSuccess: () => {
      toast({
        title: "Artwork deleted",
        description: "The artwork has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete artwork: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDownloadTrack = async (trackIndex: number) => {
    try {
      const res = await fetch(`/api/submissions/${submission.id}/tracks/${trackIndex}/download`);
      if (!res.ok) {
        throw new Error("Failed to download track");
      }
      
      const data = await res.json();
      if (data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.target = '_blank';
        link.download = submission.tracks[trackIndex].title + '.mp3'; // Assuming mp3 format
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: "Your download should begin shortly.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download track",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadArtwork = async () => {
    try {
      const res = await fetch(`/api/submissions/${submission.id}/artwork/download`);
      if (!res.ok) {
        throw new Error("Failed to download artwork");
      }
      
      const data = await res.json();
      if (data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.target = '_blank';
        link.download = submission.artwork.name || 'artwork.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: "Your download should begin shortly.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download artwork",
        variant: "destructive",
      });
    }
  };

  const deleteArtworkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/submissions/${submission.id}/artwork`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete artwork");
      }
    },
    onSuccess: () => {
      toast({
        title: "Artwork deleted",
        description: "The artwork has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete artwork: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDownloadTrack = async (trackIndex: number) => {
    try {
      const res = await fetch(`/api/submissions/${submission.id}/tracks/${trackIndex}/download`);
      if (!res.ok) {
        throw new Error("Failed to download track");
      }
      const data = await res.json();
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = submission.tracks[trackIndex].title || `track-${trackIndex}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your download has started.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download track: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDownloadArtwork = async () => {
    try {
      const res = await fetch(`/api/submissions/${submission.id}/artwork/download`);
      if (!res.ok) {
        throw new Error("Failed to download artwork");
      }
      const data = await res.json();
      
      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = `artwork-${submission.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your download has started.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download artwork: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrack = (trackIndex: number) => {
    setSelectedTrackIndex(trackIndex);
    setIsDeleteTrackDialogOpen(true);
  };

  const confirmDeleteTrack = () => {
    if (selectedTrackIndex !== null) {
      deleteTrackMutation.mutate(selectedTrackIndex);
    }
    setIsDeleteTrackDialogOpen(false);
  };

  const handleDeleteArtwork = () => {
    setIsDeleteArtworkDialogOpen(true);
  };

  const confirmDeleteArtwork = () => {
    deleteArtworkMutation.mutate();
    setIsDeleteArtworkDialogOpen(false);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{submission.artistName} - {submission.title}</CardTitle>
            <CardDescription>
              {submission.releaseType} • {submission.genre} • Status: {submission.status}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            Back to List
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Artwork Section */}
        {submission.artwork && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Artwork</h3>
            <div className="flex items-start space-x-4">
              <img 
                src={submission.artwork.url} 
                alt="Cover Artwork" 
                className="w-32 h-32 object-cover rounded-md"
              />
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadArtwork}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteArtwork}
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tracks Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tracks</h3>
          <div className="space-y-3">
            {submission.tracks && submission.tracks.map((track, index) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{track.title}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadTrack(index)}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteTrack(index)}
                      className="flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {track.isrc && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">ISRC:</p>
                      <p className="text-sm">{track.isrc}</p>
                    </div>
                  )}
                  {track.upc && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">UPC:</p>
                      <p className="text-sm">{track.upc}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Metadata</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Writers/Composers:</p>
              <p className="text-sm">{submission.writersComposers || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Previously Released:</p>
              <p className="text-sm">{submission.previouslyReleased ? "Yes" : "No"}</p>
            </div>
            {submission.productionName && (
              <div>
                <p className="text-sm font-medium">Production Name:</p>
                <p className="text-sm">{submission.productionName}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Content ID:</p>
              <p className="text-sm">{submission.enableContentId ? "Enabled" : "Disabled"}</p>
            </div>
            {submission.featuredArtist && (
              <div>
                <p className="text-sm font-medium">Featured Artist:</p>
                <p className="text-sm">{submission.featuredArtist}</p>
              </div>
            )}
          </div>
          
          {/* Streaming Links */}
          {submission.streamingLinks && Object.keys(submission.streamingLinks).length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold">Streaming Links</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {submission.streamingLinks.spotify && (
                  <div>
                    <p className="text-sm font-medium">Spotify:</p>
                    <a href={submission.streamingLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                      {submission.streamingLinks.spotify}
                    </a>
                  </div>
                )}
                {submission.streamingLinks.appleMusic && (
                  <div>
                    <p className="text-sm font-medium">Apple Music:</p>
                    <a href={submission.streamingLinks.appleMusic} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                      {submission.streamingLinks.appleMusic}
                    </a>
                  </div>
                )}
                {submission.streamingLinks.youtubeMusic && (
                  <div>
                    <p className="text-sm font-medium">YouTube Music:</p>
                    <a href={submission.streamingLinks.youtubeMusic} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block">
                      {submission.streamingLinks.youtubeMusic}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Release Information */}
          <div className="mt-4">
            <h4 className="text-md font-semibold">Release Information</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-sm font-medium">Release Type:</p>
                <p className="text-sm capitalize">{submission.releaseType}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Genre:</p>
                <p className="text-sm">{submission.genre}</p>
              </div>
              {submission.tracks && submission.tracks.some(track => track.upc) && (
                <div>
                  <p className="text-sm font-medium">UPC:</p>
                  <p className="text-sm">{submission.tracks.find(track => track.upc)?.upc || "Not specified"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>ent>

      {/* Delete Track Confirmation Dialog */}
      <AlertDialog open={isDeleteTrackDialogOpen} onOpenChange={setIsDeleteTrackDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the track from the submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTrack}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Artwork Confirmation Dialog */}
      <AlertDialog open={isDeleteArtworkDialogOpen} onOpenChange={setIsDeleteArtworkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the artwork from the submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteArtwork}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
