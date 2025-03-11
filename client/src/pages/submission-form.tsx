import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubmissionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, Music4 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

const genres = [
  "Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Jazz", "Classical", "Country", "Folk",
  "Metal", "Blues", "Reggae", "World", "Latin", "Alternative", "Indie", "Dance"
];

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese",
  "Korean", "Chinese", "Arabic", "Other"
];

const releaseTypes = ["Single", "EP", "Album"];

const versionTypes = ["Original", "Remix", "Live", "Acoustic", "Cover", "Custom"];

const trackCounts = {
  "Single": [1],
  "EP": Array.from({ length: 7 }, (_, i) => i + 2), // 2-8 tracks
  "Album": Array.from({ length: 19 }, (_, i) => i + 7) // 7-25 tracks
};

export default function SubmissionForm() {
  const { toast } = useToast();
  const [trackCount, setTrackCount] = useState(1);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const form = useForm({
    resolver: zodResolver(insertSubmissionSchema),
    defaultValues: {
      artistName: "",
      email: "", // Added email to defaultValues
      genre: "",
      language: "",
      version: "",
      writerComposer: "",
      releaseType: "",
      releaseTitle: "",
      releaseDate: "",
      artworkUrl: "",
      enableYoutubeContentId: false,
      previouslyReleased: false,
      previousUpc: "",
      previousIsrc: "",
      featuredArtist: "",
      featuredArtistType: "",
      featuredArtistProfiles: {},
      streamingLinks: {},
      tracks: []
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload artwork if it exists
      if (artwork) {
        const formData = new FormData();
        formData.append('file', artwork);
        const response = await fetch('/api/upload/artwork', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        data.artworkUrl = result.url;
      }

      // Upload audio files if they exist
      if (audioFiles.length > 0) {
        data.tracks = [];
        for (let i = 0; i < audioFiles.length; i++) {
          const file = audioFiles[i];
          if (!file) continue;

          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch('/api/upload/audio', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();

          data.tracks.push({
            title: form.getValues(`tracks.${i}.title`) || `Track ${i+1}`,
            version: form.getValues(`tracks.${i}.version`) || '',
            featuredArtist: form.getValues(`tracks.${i}.featuredArtist`) || '',
            audioFile: {
              url: result.url,
              title: file.name,
              trackNumber: i + 1
            }
          });
        }
      }

      // Make the API request
      const res = await apiRequest("POST", "/api/submissions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your submission has been received"
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const previouslyReleased = form.watch("previouslyReleased");
  const featuredArtistType = form.watch("featuredArtistType");
  const releaseType = form.watch("releaseType");

  const resetForm = () => {
    form.reset();
    setArtwork(null);
    setAudioFiles([]);
    setUploadProgress({});
    setTrackCount(1);
  };

  const handleArtworkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setUploadProgress({ artwork: 0 });
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, artwork: i }));
        }
        setArtwork(file);
        toast({
          title: "Artwork uploaded",
          description: `Selected: ${file.name}`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, trackIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setUploadProgress(prev => ({ ...prev, [`audio-${trackIndex}`]: 0 }));
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [`audio-${trackIndex}`]: i }));
        }
        const newFiles = [...audioFiles];
        newFiles[trackIndex] = file;
        setAudioFiles(newFiles);
        toast({
          title: "Audio file uploaded",
          description: `Track ${trackIndex + 1}: ${file.name}`
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file",
          variant: "destructive"
        });
      }
    }
  };

  // Add form validation check function
  const isFormValid = () => {
    const values = form.getValues();
    const requiredFields = [
      'artistName',
      'email',
      'genre',
      'language',
      'writerComposer',
      'releaseType',
      'releaseTitle',
      'releaseDate'
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!values[field]) {
        return false;
      }
    }

    // Check artwork
    if (!artwork) {
      return false;
    }

    // Check audio files
    if (!audioFiles.length || audioFiles.some(file => !file)) {
      return false;
    }

    return true;
  };

  return (
    <div className="p-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Submit Your Music</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data as any))} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Release Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a genre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genres.map((genre) => (
                              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {versionTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="writerComposer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Writer/Composer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="releaseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setTrackCount(trackCounts[value as keyof typeof trackCounts]?.[0] || 1);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select release type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {releaseTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {releaseType && releaseType !== "Single" && (
                    <FormItem>
                      <FormLabel>Number of Tracks</FormLabel>
                      <Select
                        value={trackCount.toString()}
                        onValueChange={(value) => setTrackCount(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {trackCounts[releaseType as "EP" | "Album"].map((count) => (
                            <SelectItem key={count} value={count.toString()}>
                              {count} tracks
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}

                  <FormField
                    control={form.control}
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="releaseTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Release Information</h3>

                <FormField
                  control={form.control}
                  name="previouslyReleased"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Previously Released?</FormLabel>
                        <FormDescription>
                          Has this content been released before by another distributor or label?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {previouslyReleased && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="previousUpc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous UPC</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previousIsrc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous ISRC</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Options</h3>

                <FormField
                  control={form.control}
                  name="enableYoutubeContentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable YouTube Content ID</FormLabel>
                        <FormDescription>
                          Monetize and protect your content on YouTube
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Artwork</h3>
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="flex flex-col items-center gap-2">
                    {artwork ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={URL.createObjectURL(artwork)}
                          alt="Artwork preview"
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{artwork.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setArtwork(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <Label htmlFor="artwork" className="text-sm font-medium">
                          Upload Artwork
                        </Label>
                        <FormDescription>
                          3000x3000px JPG/PNG recommended
                        </FormDescription>
                        <Input
                          id="artwork"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleArtworkUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('artwork')?.click()}
                        >
                          Choose File
                        </Button>
                      </>
                    )}
                    {uploadProgress.artwork !== undefined && (
                      <Progress value={uploadProgress.artwork} className="w-full mt-2" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tracks</h3>
                {Array.from({ length: trackCount }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Track {index + 1}</h4>

                        <FormField
                          control={form.control}
                          name={`tracks.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tracks.${index}.version`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Version</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select version" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {versionTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tracks.${index}.featuredArtist`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Artist (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="border-2 border-dashed rounded-lg p-6">
                          <div className="flex flex-col items-center gap-2">
                            {audioFiles[index] ? (
                              <div className="flex items-center gap-2">
                                <Music4 className="h-6 w-6" />
                                <div>
                                  <p className="font-medium">{audioFiles[index].name}</p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newFiles = [...audioFiles];
                                      newFiles[index] = null as any;
                                      setAudioFiles(newFiles);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Music4 className="h-8 w-8 text-muted-foreground" />
                                <Label htmlFor={`audio-${index}`} className="text-sm font-medium">
                                  Upload Audio File
                                </Label>
                                <FormDescription>
                                  WAV or FLAC files only, 44.1kHz/16-bit or higher
                                </FormDescription>
                                <Input
                                  id={`audio-${index}`}
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => handleAudioUpload(e, index)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => document.getElementById(`audio-${index}`)?.click()}
                                >
                                  Choose File
                                </Button>
                              </>
                            )}
                            {uploadProgress[`audio-${index}`] !== undefined && (
                              <Progress value={uploadProgress[`audio-${index}`]} className="w-full mt-2" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {releaseType && releaseType !== "Single" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Featured Artist</h3>

                  <FormField
                    control={form.control}
                    name="featuredArtist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Artist Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featuredArtistType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Artist Profile</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select profile type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Create New Profile</SelectItem>
                            <SelectItem value="existing">Use Existing Profile</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {featuredArtistType === "existing" && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="featuredArtistProfiles.spotify"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spotify Profile URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://open.spotify.com/artist/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="featuredArtistProfiles.appleMusic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apple Music Profile URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://music.apple.com/artist/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="featuredArtistProfiles.youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube Channel URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://youtube.com/c/..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                  disabled={submitMutation.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitMutation.isPending || !isFormValid()}
                >
                  {submitMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit
                </Button>
              </div>
              {submitMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {submitMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}