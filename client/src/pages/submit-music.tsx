import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubmissionSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UploadCloud, X, Plus } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FeaturedArtist = {
  name: string;
  isPrimary: boolean;
  useExistingProfile: boolean;
  createNewProfile: boolean;
  writersComposers: string;
  streamingLinks?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
};

export default function SubmitMusic() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [uploadedTracks, setUploadedTracks] = useState<{ title: string; url: string; isrc?: string; upc?: string }[]>([]);
  const [showArtistLinks, setShowArtistLinks] = useState(false);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([]);
  const [showFeaturedArtists, setShowFeaturedArtists] = useState(false);
  const [useExistingMainProfile, setUseExistingMainProfile] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertSubmissionSchema),
    defaultValues: {
      artistName: "",
      releaseType: "single",
      title: "",
      genre: "",
      writersComposers: "", // This is for the main artist
      streamingLinks: {
        spotify: "",
        appleMusic: "",
        youtubeMusic: "",
      },
      tracks: [],
      previouslyReleased: false,
      productionName: "",
      enableContentId: false,
      artwork: null,
    },
  });

  // Watch artist name to show/hide links section
  useEffect(() => {
    const artistName = form.watch("artistName");
    setShowArtistLinks(artistName.length > 0);
  }, [form.watch("artistName")]);

  const addFeaturedArtist = () => {
    setFeaturedArtists([
      ...featuredArtists,
      {
        name: "",
        isPrimary: false,
        useExistingProfile: false,
        createNewProfile: false,
        writersComposers: "",
      },
    ]);
  };

  const removeFeaturedArtist = (index: number) => {
    setFeaturedArtists(featuredArtists.filter((_, i) => i !== index));
  };

  const updateFeaturedArtist = (index: number, data: Partial<FeaturedArtist>) => {
    setFeaturedArtists(artists =>
      artists.map((artist, i) => i === index ? { ...artist, ...data } : artist)
    );
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/submissions", {
        ...data,
        tracks: uploadedTracks,
        featuredArtists: featuredArtists
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your music has been submitted successfully. Our team will review it shortly.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (uploadedTracks.length + files.length > 20) {
      toast({
        title: "Error",
        description: "Maximum 20 tracks allowed",
        variant: "destructive",
      });
      return;
    }

    const newTracks = Array.from(files).map((file) => ({
      title: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
    }));

    setUploadedTracks([...uploadedTracks, ...newTracks]);
  };

  const removeTrack = (index: number) => {
    setUploadedTracks(uploadedTracks.filter((_, i) => i !== index));
  };

  const updateTrackMetadata = (index: number, data: Partial<{ isrc: string; upc: string }>) => {
    setUploadedTracks(tracks =>
      tracks.map((track, i) => i === index ? { ...track, ...data } : track)
    );
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap">
            <div>
              <CardTitle>Submit Your Music</CardTitle>
              <CardDescription>
                Share your artistry with the world through Prism Audio
              </CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/">← Back</Link>
            </Button>
          </CardHeader>
          <CardContent className="card-content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6 form-container">
                {/* Main Artist Section */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold">Main Artist</h3>

                  {/* Artist Name Field */}
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your artist name"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setShowArtistLinks(e.target.value.length > 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Writers & Composers for Main Artist */}
                  <FormField
                    control={form.control}
                    name="writersComposers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Writers & Composers</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the names of all writers and composers"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <AnimatePresence>
                    {showArtistLinks && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant={useExistingMainProfile ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setUseExistingMainProfile(true)}
                          >
                            Use Existing Profile
                          </Button>
                          <Button
                            type="button"
                            variant={!useExistingMainProfile ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setUseExistingMainProfile(false)}
                          >
                            Create New Profile
                          </Button>
                        </div>

                        {useExistingMainProfile ? (
                          <div className="space-y-4">
                            <FormLabel>Artist Profile Links</FormLabel>
                            <FormField
                              control={form.control}
                              name="streamingLinks.spotify"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Spotify Artist Profile URL"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="streamingLinks.appleMusic"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Apple Music Artist Profile URL"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="streamingLinks.youtubeMusic"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="YouTube Music Artist Profile URL"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : (
                          <FormDescription className="mt-2">
                            We'll create a new profile for you. You'll receive an email to claim your profile.
                          </FormDescription>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Featured Artists Section */}
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured Artists</FormLabel>
                    <FormDescription>
                      Add featured artists to your release
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={showFeaturedArtists}
                      onCheckedChange={setShowFeaturedArtists}
                    />
                  </FormControl>
                </FormItem>

                <AnimatePresence>
                  {showFeaturedArtists && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {featuredArtists.map((artist, index) => (
                        <div key={index} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <Input
                              placeholder="Featured Artist Name"
                              value={artist.name}
                              onChange={(e) => updateFeaturedArtist(index, { name: e.target.value })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFeaturedArtist(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <Switch
                              checked={artist.isPrimary}
                              onCheckedChange={(checked) => updateFeaturedArtist(index, { isPrimary: checked })}
                            />
                            <FormLabel>Primary Artist</FormLabel>
                          </div>

                          <Textarea
                            placeholder="Writers & Composers for this artist"
                            value={artist.writersComposers}
                            onChange={(e) => updateFeaturedArtist(index, { writersComposers: e.target.value })}
                            className="mt-2"
                          />

                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex-1">
                              <Button
                                type="button"
                                variant={artist.useExistingProfile ? "default" : "outline"}
                                className="w-full"
                                onClick={() => updateFeaturedArtist(index, { 
                                  useExistingProfile: true,
                                  createNewProfile: false 
                                })}
                              >
                                Use Existing Profile
                              </Button>
                            </div>
                            <div className="flex-1">
                              <Button
                                type="button"
                                variant={artist.createNewProfile ? "default" : "outline"}
                                className="w-full"
                                onClick={() => updateFeaturedArtist(index, { 
                                  createNewProfile: true,
                                  useExistingProfile: false 
                                })}
                              >
                                Create New Profile
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {artist.useExistingProfile && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                <Input placeholder="Spotify Profile URL" />
                                <Input placeholder="Apple Music Profile URL" />
                                <Input placeholder="YouTube Music Profile URL" />
                              </motion.div>
                            )}

                            {artist.createNewProfile && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                <FormDescription className="mt-2">
                                  We'll create a new profile for this artist. They'll receive an email to claim their profile.
                                </FormDescription>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFeaturedArtist}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Featured Artist
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Release Type Field */}
                <FormField
                  control={form.control}
                  name="releaseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose release type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="ep">EP</SelectItem>
                          <SelectItem value="album">Album</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("releaseType") !== "single" && (
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("releaseType") === "ep" ? "EP" : "Album"} Title
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Genre</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Hip-Hop, Rock, Electronic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Artwork Upload */}
                <div className="space-y-4">
                  <FormLabel>Cover Artwork</FormLabel>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <p className="mb-2 text-sm">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG or JPEG (Minimum 3000x3000px)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // For demo, create an object URL
                            const url = URL.createObjectURL(file);
                            form.setValue("artwork", {
                              url,
                              name: file.name
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  {form.watch("artwork") && (
                    <div className="relative w-32 h-32">
                      <img
                        src={form.watch("artwork")?.url}
                        alt="Cover artwork"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => form.setValue("artwork", null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tracks Section */}
                <div>
                  <FormLabel>Upload Tracks</FormLabel>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-2" />
                          <p className="mb-2 text-sm">
                            <span className="font-semibold">Click to upload</span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            WAV, MP3, M4A, FLAC, AIFF, or WMA (Max 20 tracks)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="audio/*"
                          multiple
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {uploadedTracks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadedTracks.map((track, index) => (
                        <div key={index} className="space-y-2 p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{track.title}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTrack(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <AnimatePresence>
                            {form.watch("previouslyReleased") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-2 gap-2 mt-2"
                              >
                                <Input
                                  placeholder="ISRC (if available)"
                                  value={track.isrc || ""}
                                  onChange={(e) => updateTrackMetadata(index, { isrc: e.target.value })}
                                />
                                <Input
                                  placeholder="UPC (if available)"
                                  value={track.upc || ""}
                                  onChange={(e) => updateTrackMetadata(index, { upc: e.target.value })}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Production Details and Content ID */}
                <FormField
                  control={form.control}
                  name="productionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter production name or company"
                          {...field}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableContentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Content ID</FormLabel>
                        <FormDescription>
                          Protect your music and earn from user-generated content
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

                {/* Previously Released Section moved to bottom */}
                <FormField
                  control={form.control}
                  name="previouslyReleased"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Previously Released</FormLabel>
                        <FormDescription>
                          Check if this music was previously released on other platforms
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending || uploadedTracks.length === 0}
                >
                  {submitMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Music
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}