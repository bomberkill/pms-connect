"use client"

import { useAppDispatch, useAppSelector, useDictionary, useNotification } from "@/lib/hooks"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Camera, MessageCircle, Link as LinkIcon, UserMinus, Check, MoreVertical, Ban, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MAX_FILE_SIZE, uploadFileToSupabase } from "@/components/Register-form"
import { supabase } from "@/lib/supabaseClient"
import { fetchMe, updateUser } from "@/redux/services/userService"
import React, { useEffect, useState } from "react"
import ConfirmationDialog from "@/components/ConfirmationDialog"
import UpdateProfileDialog from "@/components/UpdateProfileDialog"
import CustomLoader from "@/components/Loader"
import { User, UserTypeGQL } from "@/types/User"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apolloClient } from "@/graphql/apolloClient";
import { buildGetUserBySlugQuery } from "@/graphql/queries/index"

function extractFilePath(publicUrl: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error("Invalid Supabase public URL");
  }
  return publicUrl.substring(idx + marker.length);
}
import { useConnectionActions, useConnectionRequests, useConnectionRequestUpdatedSubscription, useFollowActions, useFollowsSubscription } from "@/hooks/useData/index"
import { ConnectionRequestStatus } from "@/types/ConnectionRequest"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"

// NOTE: This page is now dynamic. The folder structure should be `/profile/[id]/page.tsx`
export default function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const dict = useDictionary()
  const dispatch = useAppDispatch()
  const {open} = useNotification()
  const { slug } = React.use(params);
  const isMobile = useIsMobile()
  
  // We'll fetch the profile user's data based on the ID in the URL
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
  }, [])

  const { loading: authUserLoading, user: authUser } = useAppSelector((state) => state.user);

  
  useEffect(() => {
    const fetchUserBySlug = async (slug: string) => {
      console.log("Fetching user with slug:", slug);
      setLoading(true);
      try {
        const {data, errors} = await apolloClient.query({
          query: buildGetUserBySlugQuery(),
          variables: { slug },
          fetchPolicy: 'network-only',
        })
        // console.log("GraphQL response data:", data);
        if(errors && errors.length > 0) {
          console.error("GraphQL errors:", errors);
          setProfileUser(null);
        } else {
          setProfileUser(data.getUserBySlug);
          // console.log("Fetched user data:", data.getUserBySlug);
        }
      } catch(error) {
        console.error("GraphQL errors:", error);
        setProfileUser(null);
      }finally {
        setLoading(false);
      }
    }
    if(slug) {
      if (authUserLoading) {
        return;
      }
      if(slug !== authUser?.slug) {
        fetchUserBySlug(slug);
        setIsOwnProfile(false);
      } else {
        setProfileUser(authUser);
        setLoading(authUserLoading);
        setIsOwnProfile(true);
      }
    };
  }, [slug, authUser, authUserLoading]);

  // const isOwnProfile = authUser?.slug === slug;

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
          const uploadedFile = await uploadFileToSupabase(file, `public/${authUser?.firebaseUid}/${field}`);
          if (!uploadedFile) return;

          uploadedPath = uploadedFile.uploadedPath;
          const fieldToUpdate = field === "profile" ? "profilePicUrl" : "coverPicUrl";

          // Update User dans Redux
          await dispatch(updateUser({ [fieldToUpdate]: uploadedFile.publicUrl })).unwrap();

          open("success", dict.notifications.profileUpdated.title, {
            message: dict.notifications.profileUpdated.message,
          });

          // Supprimer l’ancienne image si elle existe
          const publicUrl = field === "profile" ? authUser?.profilePicUrl : authUser?.coverPicUrl;
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

  // --- LOGIQUE DE SUIVI ET DE CONNEXION ---
  const isFollowing = authUser?.following?.includes(profileUser?.id ?? '');
  const isConnected = authUser?.connections?.includes(profileUser?.id ?? '');
  const {requests, refetch: refetchRequests} = useConnectionRequests(ConnectionRequestStatus.PENDING);
  const pendingRequest = requests?.find(req => (req.requester.id === profileUser?.id || req.recipient.id === profileUser?.id));
  const {followUser, unfollowUser} = useFollowActions();
  const {sendRequest, removeConnection, acceptRequest, declineRequest} = useConnectionActions();
  const { followsUpdated } = useFollowsSubscription(profileUser?.id ?? '');
  const { updatedRequest } = useConnectionRequestUpdatedSubscription();

  useEffect(() => {
    if(followsUpdated ) {
      if(followsUpdated.follower.userId === authUser?.id || followsUpdated.following.userId === authUser?.id) {
        dispatch(fetchMe());
        // console.log("Follows updated, refetching auth user data...", followsUpdated);
        return;
      }
    }
  }, [followsUpdated])

  useEffect(() => {
    if (updatedRequest) {
      // console.log('Connection request updated, refetching requests...', updatedRequest);
      refetchRequests(); // Refetch the connection requests
    }
  }, [updatedRequest, refetchRequests]);



  // Skeleton view
  if (loading || !profileUser) {
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
      {profileUser.coverPicUrl && (
        <div className="relative w-full h-48 md:h-60 lg:h-72">
          <Image
            src={profileUser.coverPicUrl}
            alt="Cover"
            fill
            className="object-cover md:rounded-t-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent rounded-t-lg" />
          
          {/* Bouton pour changer la cover */}
          {isOwnProfile && (
            <>
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
            </>
          )}
        </div>

      )}

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-16 relative ">
        <div className="flex row justify-between items-end md:ml-6">
          <div>
            <div className="relative group h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28">
              <Avatar className="h-full w-full border-4 border-white shadow-lg">
                <AvatarImage
                  className="object-cover"
                  src={profileUser.profilePicUrl}
                  alt={profileUser.userType === UserTypeGQL.INDIVIDUAL ? profileUser.firstName : profileUser.entityName}
                />
                <AvatarFallback className="text-4xl">
                  {profileUser.userType === UserTypeGQL.INDIVIDUAL ? `${profileUser.firstName?.[0]}${profileUser.lastName?.[0]}` : profileUser.entityName?.[0]}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                    <label htmlFor="profilePicFile">
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                        <Camera className="h-7 w-7 text-white" />
                      </div>
                    </label>
                  <Input 
                    id="profilePicFile"
                    name="profilePicFile"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={(event) => handleFileChange(event, "profile")}
                  />
                </>
              )}
            </div>

            <h1 className="text-lg font-medium">
              {"firstName" in profileUser
                ? `${profileUser.firstName} ${profileUser.lastName}`
                : profileUser.entityName}
            </h1>

            <p className="text-sm text-muted-foreground">
              {"firstName" in profileUser
                ? profileUser.professionalTitle || ""
                : profileUser.entityType}
            </p>

            {profileUser.websiteUrl && (
              <a
                href={profileUser.websiteUrl.startsWith("http") ? profileUser.websiteUrl : `https://${profileUser.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profileUser.websiteUrl}
              </a>
            )}
          </div>

          {isOwnProfile ? (
            <UpdateProfileDialog user={profileUser}>
              <Button className="mt-4 cursor-pointer">{dict.button.edit}</Button>
            </UpdateProfileDialog>
          ) : (
            <div className="flex items-center gap-2">
              {isFollowing ? (
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={async() => {await unfollowUser({variables:{userId: profileUser?.id}});}}>
                  <div className="flex items-center gap-2">
                    {/* <UserCheck className="h-4 w-4" /> */}
                    {dict.actions.unfollow}
                  </div>
                </Button>
              ) : (
                <Button className="cursor-pointer" variant="outline" size="sm" onClick={async() => {await followUser({variables:{userId: profileUser?.id}});}}>
                  <div className="flex items-center gap-2">
                    {/* <UserPlus className="h-4 w-4" /> */}
                    {dict.actions.follow}
                  </div>
                </Button>
              )}
              {!isMobile && (
                <>
                  {pendingRequest ? (
                    pendingRequest.recipient.id === profileUser?.id ? (
                      <Button className="cursor-pointer" variant="destructive" size="sm" onClick={() => declineRequest({variables: {requestId: pendingRequest.id}})}>
                        <div className="flex items-center gap-2">
                          {/* <UserMinus className="h-4 w-4" /> */}
                          {dict.actions.cancelRequest}
                        </div>
                      </Button>
                    ) : (
                      <Button className="cursor-pointer" size="sm" onClick={ async() => { await acceptRequest({variables: {requestId: pendingRequest.id}});}}>
                        <div className="flex items-center gap-2">
                          {/* <Check className="h-4 w-4" /> */}
                          {dict.actions.acceptRequest}
                        </div>
                      </Button>
                    )
                  )
                  : isConnected ? (
                    <Button className="cursor-pointer" variant="destructive" size="sm" onClick={async() => {await removeConnection({variables: {userIdB: profileUser?.id}});}}>
                      <div className="flex items-center gap-2">
                        {/* <UserMinus className="h-4 w-4" /> */}{dict.actions.disconnect}
                      </div>
                    </Button>
                  ) : (
                    <Button className="cursor-pointer" variant="outline" size="sm" onClick={() => sendRequest({variables:{recipientId: profileUser?.id}})}>
                      <div className="flex text-sm items-center gap-2">
                        {/* <LinkIcon className="h-4 w-4" /> */}{dict.actions.connect}
                      </div>
                    </Button>
                  )
                  }
                </>
              )}
              <Button className="cursor-pointer" size="sm" asChild>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </Button>
              {isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label="More options" size="icon" variant="outline" className="p-1 rounded-md hover:bg-muted">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                      {pendingRequest ? (
                        pendingRequest.recipient.id === profileUser?.id ? (
                          <DropdownMenuItem onClick={() => declineRequest({variables: {requestId: pendingRequest.id}})} className="cursor-pointer">
                            <UserMinus className="mr-2 h-4 w-4" />
                            {dict.actions.cancelRequest}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => acceptRequest({variables: {requestId: pendingRequest.id}})} className="cursor-pointer">
                            <Check className="mr-2 h-4 w-4" />
                            {dict.actions.acceptRequest}
                          </DropdownMenuItem>
                        )
                      )
                      : isConnected ? (
                        <DropdownMenuItem onClick={() => removeConnection({variables: {userIdB: profileUser?.id}})} className="cursor-pointer">
                          <UserMinus className="mr-2 h-4 w-4" />
                          {dict.actions.disconnect}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => sendRequest({variables:{recipientId: profileUser?.id}})} className="cursor-pointer">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          {dict.actions.connect}
                        </DropdownMenuItem>
                      )
                    }
                    <DropdownMenuItem className="cursor-pointer"><Ban className="mr-2 h-4 w-4" /> {dict.actions.mute}</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer"><Flag className="mr-2 h-4 w-4" /> {dict.actions.report}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
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
                {profileUser.bio || dict.profile.noBio}
              </p>
            </section>

            {/* Stats */}
            <section className="mt-8">
              <h2 className="text-md font-medium mb-2">{dict.profile.stats.title}</h2>
              <div className="grid grid-cols-3 gap-4">
                  <Card className="hover:bg-accent">
                    <CardContent className="flex flex-col items-center p-4">
                      <p className="text-lg font-semibold">{profileUser.connections.length}</p>
                      <span className="text-sm text-muted-foreground">{dict.profile.stats.posts}</span>
                    </CardContent>
                  </Card>
                {/* <Link href={`/${lang}/profile/${params.id}/connections`}>
                </Link> */}
                  <Card className="hover:bg-accent">
                    <CardContent className="flex flex-col items-center p-4">
                      <p className="text-lg font-semibold">{profileUser.followers.length}</p>
                      <span className="text-sm text-muted-foreground">{dict.profile.stats.followers}</span>
                    </CardContent>
                  </Card>
                {/* <Link href={`/${lang}/profile/${params.id}/followers`}>
                </Link>
                <Link href={`/${lang}/profile/${params.id}/following`}>
                </Link> */}
                  <Card className="hover:bg-accent">
                    <CardContent className="flex flex-col items-center p-4">
                      <p className="text-lg font-semibold">{profileUser.following.length}</p>
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
