"use client";

import { PlantPhoto, PlantWithPhotoAndId } from "@/core/domain/plant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Check, Camera, Star, StarOff, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DeletePlantButton } from "@/components/delete-plant-button";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPlantPhoto } from "@/app/actions/plants/upload-plant-photo";
import { getPlantPhotos } from "@/app/actions/plants/get-plant-photos";
import { setMainPhoto } from "@/app/actions/plants/set-main-photo";
import { deletePlantPhoto } from "@/app/actions/plants/delete-plant-photo";
import { toast } from "sonner";
import { PlantCareHistoryContainer } from "./plant-care-history-container";

type PlantDetailProps = {
  plant: PlantWithPhotoAndId;
};

export function PlantDetail({ plant }: PlantDetailProps) {
  const router = useRouter();
  const [isDeleted, setIsDeleted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<PlantPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  // Load photos on component mount
  useEffect(() => {
    const loadPhotos = async () => {
      const { photos, error } = await getPlantPhotos(plant.id);
      if (error) {
        toast.error(error);
      } else {
        setPhotos(photos);
      }
      setIsLoadingPhotos(false);
    };
    loadPhotos();
  }, [plant.id]);

  // Check if plant is already deleted
  useEffect(() => {
    if (plant.deletedAt) {
      setIsDeleted(true);
      const timer = setTimeout(() => {
        router.back();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [plant.deletedAt, router]);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteSuccess = () => {
    setIsDeleted(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("plantId", plant.id);

      const { photo, error } = await uploadPlantPhoto(formData);
      if (error) {
        toast.error(error);
        return;
      }

      if (photo) {
        setPhotos([...photos, photo]);
        toast.success("Photo uploaded successfully");
      }
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleSetMainPhoto = async (photoId: string) => {
    const { plant: updatedPlant, error } = await setMainPhoto(
      plant.id,
      photoId
    );
    if (error) {
      toast.error(error);
      return;
    }

    if (updatedPlant) {
      router.refresh(); // Refresh the page to show the new main photo
      toast.success("Main photo updated");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const { success, error } = await deletePlantPhoto(plant.id, photoId);
    if (error) {
      toast.error(error);
      return;
    }

    if (success) {
      setPhotos(photos.filter((p) => p.id !== photoId));
      if (photos.find((p) => p.id === photoId)?.url === plant.mainPhotoUrl) {
        // If we deleted the main photo, refresh to update the UI
        router.refresh();
      }
      toast.success("Photo deleted successfully");
    }
  };

  if (isDeleted) {
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

      <Card className="bg-background">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
            {plant.mainPhotoUrl ? (
              <Image
                src={plant.mainPhotoUrl}
                alt=""
                fill
                className="object-cover"
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
          <div className="flex items-center justify-between p-4 bg-card">
            <h1 className="text-2xl font-semibold">{plant.name}</h1>
            <DeletePlantButton
              plantId={plant.id}
              plantName={plant.name}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card">
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="care">Care History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="mt-4">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Photos</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
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
                    {selectedFile && (
                      <Button
                        onClick={handleUploadPhoto}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {isLoadingPhotos ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      Loading photos...
                    </div>
                  ) : photos.length === 0 ? (
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
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 opacity-100">
                          {new Date(photo.takenAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:text-white hover:bg-black/20"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="care" className="mt-4">
            <PlantCareHistoryContainer plantId={plant.id} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Notes</h2>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">No notes yet.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
