"use client";

import { PlantPhoto, PlantWithPhotoAndId } from "@/core/domain/plant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  Camera,
  Star,
  StarOff,
  Trash2,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DeletePlantButton } from "@/components/delete-plant-button";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitPlantPhotoUpload } from "@/app/server-functions/plants/upload-plant-photo";
import { submitMainPhoto } from "@/app/server-functions/plants/set-main-photo";
import { submitPlantPhotoDeletion } from "@/app/server-functions/plants/delete-plant-photo";
import { toast } from "sonner";
import { PlantCareHistoryContainer } from "./plant-care-history-container";
import { ButtonWithConfirmation } from "@/components/ui/button-with-confirmation";
import { EditPlantDialog } from "./edit-plant-dialog";
import { PlantNotesContainer } from "./plant-notes-container";
import imageCompression from "browser-image-compression";
import { Note } from "@/core/domain/note";

interface PlantDetailProps {
  plant: PlantWithPhotoAndId;
  initialPhotos: PlantPhoto[];
  initialNotes: Note[];
  locations: Array<{ id: string; name: string }>;
}

export function PlantDetail({
  plant,
  initialPhotos,
  initialNotes,
  locations,
}: PlantDetailProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PlantPhoto[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteSuccess = () => {
    router.push("/plants");
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Compress image before upload - prioritize quality for plant photos
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 638,
        useWebWorker: true,
        fileType: "image/jpeg" as const,
        initialQuality: 0.95, // Very high quality - 95%
      };

      const compressedFile = await imageCompression(file, compressionOptions);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("plantId", plant.id);
      const [photo, error] = await submitPlantPhotoUpload(formData);
      if (photo) {
        setPhotos([...photos, photo]);
        if (!plant.mainPhotoUrl) {
          await submitMainPhoto({ plantId: plant.id, photoId: photo.id });
          router.refresh();
        }
        toast.success("Photo uploaded successfully!");
      } else if (error) {
        toast.error(error);
      }
    } catch (compressionError) {
      console.error("Image compression failed:", compressionError);
      toast.error("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetMainPhoto = async (photoId: string) => {
    const [photo, error] = await submitMainPhoto({
      plantId: plant.id,
      photoId,
    });
    if (!error && photo) {
      router.refresh();
    } else {
      toast.error(error || "Failed to set main photo");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const [result, error] = await submitPlantPhotoDeletion({
      plantId: plant.id,
      photoId,
    });
    if (result) {
      setPhotos(photos.filter((p) => p.id !== photoId));
      if (plant.mainPhotoUrl) {
        router.refresh();
      }
    } else {
      toast.error(error || "Failed to delete photo");
    }
  };

  if (plant.deletedAt) {
    return (
      <div className="container max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Plant Deleted Successfully
            </h2>
            <p className="text-gray-500">Redirecting to your plants...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Button
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
          variant="ghost"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to plants
        </Button>
      </div>

      <Card hasPaddingTop={false} className="bg-background">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
            {plant.mainPhotoUrl ? (
              <Image
                src={plant.mainPhotoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 800px"
                priority={true}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Image
                  src="/placeholderPlant.svg"
                  alt=""
                  width={200}
                  height={200}
                  className="opacity-50"
                />
              </div>
            )}
          </div>
          <div className="p-4 bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold truncate select-all">
                  {plant.name}
                </h1>
                {plant.species && (
                  <p className="text-sm text-muted-foreground select-all">
                    {plant.species}
                  </p>
                )}
                {plant.location && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{plant.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <EditPlantDialog
                  plantId={plant.id}
                  currentName={plant.name}
                  currentSpecies={plant.species}
                  currentLocationId={plant.locationId}
                  locations={locations}
                  plantSlug={plant.slug}
                />
                <DeletePlantButton
                  plantId={plant.id}
                  plantName={plant.name}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Tabs defaultValue="care" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="care">Care History</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="care" className="mt-4">
            <PlantCareHistoryContainer plantId={plant.id} />
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Photos</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <Label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 dark:border-input dark:text-foreground"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Select Photo
                    </Label>
                    {isUploading && (
                      <Button disabled={isUploading}>Uploading...</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photos.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No photos yet
                    </div>
                  ) : (
                    photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square relative bg-gray-100 rounded-lg group"
                      >
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 250px"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2">
                          {new Date(photo.takenAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div className="absolute inset-0 transition-all">
                          <div className="md:hidden absolute top-0 right-0 flex items-center gap-1 p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-black/60 text-white hover:bg-black/80 hover:text-white"
                              onClick={() => handleSetMainPhoto(photo.id)}
                            >
                              {plant.mainPhotoUrl === photo.url ? (
                                <Star className="h-5 w-5 fill-white" />
                              ) : (
                                <StarOff className="h-5 w-5" />
                              )}
                            </Button>
                            <ButtonWithConfirmation
                              variant="ghost"
                              size="icon"
                              className="bg-black/60 text-white hover:bg-black/80 hover:text-white"
                              onConfirm={() => handleDeletePhoto(photo.id)}
                              dialogTitle="Delete Photo"
                              dialogDescription="Are you sure you want to delete this photo? This action cannot be undone."
                              confirmText="Delete"
                              longPressEnabled={false}
                            >
                              <Trash2 className="h-5 w-5" />
                            </ButtonWithConfirmation>
                          </div>
                          <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 before:absolute before:inset-0 before:bg-black/30 before:opacity-0 before:transition-opacity group-hover:before:opacity-100">
                            <div className="relative z-10 flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:text-white hover:bg-black/20"
                                onClick={() => handleSetMainPhoto(photo.id)}
                              >
                                {plant.mainPhotoUrl === photo.url ? (
                                  <Star className="h-5 w-5 fill-white" />
                                ) : (
                                  <StarOff className="h-5 w-5" />
                                )}
                              </Button>
                              <ButtonWithConfirmation
                                variant="ghost"
                                size="icon"
                                className="text-white hover:text-white hover:bg-black/20"
                                onConfirm={() => handleDeletePhoto(photo.id)}
                                dialogTitle="Delete Photo"
                                dialogDescription="Are you sure you want to delete this photo? This action cannot be undone."
                                confirmText="Delete"
                                longPressEnabled={false}
                              >
                                <Trash2 className="h-5 w-5" />
                              </ButtonWithConfirmation>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <PlantNotesContainer
              plantId={plant.id}
              initialNotes={initialNotes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
