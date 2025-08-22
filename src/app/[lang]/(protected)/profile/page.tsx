"use client"

import { useAppDispatch, useAppSelector, useDictionary, useNotification } from "@/lib/hooks"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { UserTypeGQL } from "@/types/User"
import { Camera, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MAX_FILE_SIZE, uploadFileToSupabase } from "@/components/Register-form"
import { supabase } from "@/lib/supabaseClient"
import { updateUser } from "@/redux/services/userService"
import { useState } from "react"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import UpdateProfileDialog from "@/components/UpdateProfileDialog"
import CustomLoader from "@/components/Loader"

function extractFilePath(publicUrl: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error("Invalid Supabase public URL");
  }
  return publicUrl.substring(idx + marker.length);
}
export default function ProfilePage() {
  const dict = useDictionary()
  const dispatch = useAppDispatch()
  const {open} = useNotification()

  const {loading, user } = useAppSelector((state) => state.user)
  const [isUploading, setIsUploading] = useState(false)
  let uploadedPath: string;
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "profile" | "cover"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      open("info", dict.notifications.warning, { message: dict.validation.file.onlyPng });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      open("info", dict.notifications.warning, { message: dict.validation.file.tooLarge });
      return;
    }

    // 2. Si le fichier est valide -> on ouvre la confirmation
    setDialogConfig({
      isOpen: true,
      title: dict.profile.confirmUpdate.title,
      message: field === "profile" ? dict.profile.confirmUpdate.messageProfile : dict.profile.confirmUpdate.messageCover,
      onConfirm: async () => {
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
        setIsUploading(true);
        // let uploadedPath: string;

        try {
          // Upload dans Supabase
          const uploadedFile = await uploadFileToSupabase(file, `public/${user?.firebaseUid}/${field}`);
          if (!uploadedFile) return;

          uploadedPath = uploadedFile.uploadedPath;
          const fieldToUpdate = field === "profile" ? "profilePicUrl" : "coverPicUrl";

          // Update User dans Redux
          await dispatch(updateUser({ [fieldToUpdate]: uploadedFile.publicUrl })).unwrap();

          open("success", dict.notifications.register.success.title, {
            message: dict.notifications.register.success.message,
          });

          // Supprimer l’ancienne image si elle existe
          const publicUrl = field === "profile" ? user?.profilePicUrl : user?.coverPicUrl;
          if (publicUrl) {
            const filePath = extractFilePath(publicUrl, "pms-connect-bucket");
            const { error: removeErr } = await supabase.storage.from("pms-connect-bucket").remove([filePath]);
            if (removeErr) console.error("Erreur suppression :", removeErr.message);
          }
        } catch (error) {
          // Rollback si upload fail
          console.error("error:", error);
          try {
            if (uploadedPath) {
              const { error: removeErr } = await supabase.storage.from("pms-connect-bucket").remove([uploadedPath]);
              if (removeErr) console.error("Erreur rollback :", removeErr.message);
            }
          } catch (err) {
            console.error("Rollback Supabase failed:", err);
          }
        } finally {
          setIsUploading(false);
        }
      },
      onCancel: () => {
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Skeleton view
  if (loading || !user) {
    return (
      <div className="bg-background min-h-screen">
        {/* Cover skeleton */}
        <Skeleton className="w-full h-48 md:h-60 lg:h-72" />

        {/* Profile Info Skeleton */}
        <div className="max-w-5xl mx-auto px-4 -mt-16 relative flex flex-col items-center">
          <Skeleton className="w-28 h-28 rounded-full border-4 border-background" />
          <Skeleton className="w-48 h-6 mt-4 rounded" />
          <Skeleton className="w-64 h-4 mt-2 rounded" />
          <Skeleton className="w-40 h-4 mt-2 rounded" />
          <Skeleton className="w-28 h-10 mt-4 rounded" />

          {/* Tabs Skeleton */}
          <div className="mt-10 w-full">
            <Skeleton className="w-full h-10 mb-6 rounded" />
            <Skeleton className="w-full h-20 mb-4 rounded" />
            <Skeleton className="w-full h-20 mb-4 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-background shadow-sm md:m-5 pb-5 min-h-screen md:rounded-lg">
      {isUploading && <CustomLoader />}
      {/* Cover Photo */}
      {user.coverPicUrl && (
        <div className="relative w-full h-48 md:h-60 lg:h-72">
          <Image
            src={user.coverPicUrl}
            alt="Cover"
            fill
            className="object-cover md:rounded-t-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent rounded-t-lg" />
          
          {/* Bouton pour changer la cover */}
          <label htmlFor="coverPicFile">
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-300 shadow-md flex items-center justify-center cursor-pointer hover:bg-white">
              <Camera className="w-5 h-5 text-gray-700" />
            </div>
          </label>
          <Input 
            id="coverPicFile"
            name="coverPicFile"
            type="file"
            className="hidden"
            accept="image/png, image/jpeg"
            onChange={(event) => handleFileChange(event, "cover")}
          />
        </div>

      )}

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-8 -mt-10 md:-mt-16 relative ">
        <div className="flex row justify-between items-end md:ml-6">
          <div>
            {user.profilePicUrl && (
              <div className="relative h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28">
                <Image src={user.profilePicUrl} alt="Profile" fill className="object-cover rounded-full border-2 border-white shadow-lg"/>
                  {/* <label htmlFor="profilePicFile">
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                      <Camera className="h-7 w-7 text-white" />
                    </div>
                  </label> */}
                {/* </Image> */}
                {/* <Avatar className="h-full w-full relative avatar rounded-full border-4 border-white shadow-lg">
                  <AvatarImage
                    className="object-cover relative"
                    src={user.profilePicUrl}
                    alt={user.userType === UserTypeGQL.INDIVIDUAL ? user.firstName : user.entityName}
                  />
                  <AvatarFallback className="rounded-full">CN</AvatarFallback>

                </Avatar> */}
                  {/* <label htmlFor="profilePicFile">
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                      <Camera className="h-7 w-7 text-white" />
                    </div>
                  </label> */}
                <Input 
                  id="profilePicFile"
                  name="profilePicFile"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={(event) => handleFileChange(event, "profile")}
                />
              </div>
            )}

            <h1 className="text-lg font-medium">
              {"firstName" in user
                ? `${user.firstName} ${user.lastName}`
                : user.entityName}
            </h1>

            <p className="text-sm text-muted-foreground">
              {"firstName" in user
                ? user.professionalTitle || ""
                : user.entityType}
            </p>

            {user.websiteUrl && (
              <a
                href={user.websiteUrl.startsWith("http") ? user.websiteUrl : `https://${user.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {user.websiteUrl}
              </a>
            )}
          </div>

          <UpdateProfileDialog user={user}>
            <Button className="mt-4 cursor-pointer">{dict.button.edit}</Button>
          </UpdateProfileDialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-10">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">{dict.profile.tabs.about}</TabsTrigger>
            <TabsTrigger value="posts">{dict.profile.tabs.posts}</TabsTrigger>
            <TabsTrigger value="experience">{dict.profile.tabs.experience}</TabsTrigger>
            <TabsTrigger value="activity">{dict.profile.tabs.activity}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            {/* About Section */}
            <section>
              <h2 className="text-md font-medium mb-2">{dict.profile.tabs.about}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {user.bio || dict.profile.noBio}
              </p>
            </section>

            {/* Stats */}
            <section className="mt-8">
              <h2 className="text-md font-medium mb-2">{dict.profile.stats.title}</h2>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="flex flex-col items-center">
                    <p className="text-lg font-semibold">{user.connections.length}</p>
                    <span className="text-sm text-muted-foreground">{dict.profile.stats.posts}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center">
                    <p className="text-lg font-semibold">{user.followers.length}</p>
                    <span className="text-sm text-muted-foreground">{dict.profile.stats.followers}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center">
                    <p className="text-lg font-semibold">{user.following.length}</p>
                    <span className="text-sm text-muted-foreground">{dict.profile.stats.following}</span>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
      <ConfirmationDialog
        open={dialogConfig.isOpen}
        onOpenChange={(isOpen) => setDialogConfig((prev) => ({ ...prev, isOpen }))}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        title={dialogConfig.title}
        message={dialogConfig.message}
      />
    </div>
  )
}
