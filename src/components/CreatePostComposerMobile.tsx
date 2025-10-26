"use client";

import React, { useMemo, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAppSelector, useDictionary, useNotification } from "@/lib/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextareaAutosize from "react-textarea-autosize"; 
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Trash2, Video, FileIcon, X, Loader2 } from "lucide-react";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { usePostMutations } from "@/hooks/useData/index";
import { MAX_FILE_SIZE, uploadFileToSupabase } from "@/components/Register-form";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MediaItem, MediaType } from "@/types/Post";
import { cn } from "@/lib/utils";
import { useMediaHandler } from "@/hooks/use-media-handler";
import { CreatePostComposerProps } from "./CreatePostComposer";

export default function CreatePostComposerMobile({ onCreated, onClose, placeholder, className }: CreatePostComposerProps) {
  const dict = useDictionary();
  const { user } = useAppSelector((state) => state.user);
  const { createPost, creating } = usePostMutations();
  const [isCreating, setIsCreating] = useState(false)
  const { open } = useNotification();
  const router = useRouter();

  const { mediaFiles, mediaPreviews, handleFileChange, removeMedia, resetMedia } = useMediaHandler(4);

  const validationSchema = yup.object({
    content: yup
      .string()
      .required(dict.validation.post.contentRequired)
      .max(2000, dict.validation.post.contentMax),
    mediaFile: yup
      .array()
      .of(
        yup
          .mixed<File>()
          .required()
          .test("fileType", dict.validation.file.unsupported, (value) => {
            if (!value) return true;
            return ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime", "application/pdf"].includes(value.type);
          })
          .test("fileSize", dict.validation.file.tooLarge, (value) => {
            if (!value) return true;
            return value.size <= MAX_FILE_SIZE * 5; // 10MB
          })
      )
      .max(4, "You can upload a maximum of 4 files."),
  });

  const formik = useFormik({
    initialValues: {
      content: "",
      mediaFiles: [] as File[],
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log("Submitting form:", values)
      if (!user) return;

      let media: MediaItem[] = [];
      setIsCreating(true);

      try {
        if (mediaFiles.length > 0) {
          const uploadResults = await Promise.all(
            mediaFiles.map((file) => uploadFileToSupabase(file, `public/${user.firebaseUid}/posts`))
          );

          media = mediaFiles.reduce<MediaItem[]>((acc, file, idx) => {
            const result = uploadResults[idx];
            if (result?.publicUrl) {
              acc.push({ 
                url: result.publicUrl,
                type: file.type.startsWith("video/") ? MediaType.VIDEO 
                    : file.type.startsWith("image/") ? MediaType.IMAGE 
                    : MediaType.DOCUMENT,
              });
            }
            return acc;
          }, []);

          if (media.length !== mediaFiles.length) throw new Error(dict.notifications.postCreationFailed.message.uploadFailed);
        }

        await createPost({
          variables: {
            createPostInput: {
              content: values.content,
              media: media.length > 0 ? media : undefined,
            },
          },
        });

        open("success", dict.notifications.postCreated.title, { message: dict.notifications.postCreated.message });
        resetMedia();
        formik.resetForm();
        onCreated?.();
        onClose?.();
        router.push("/");
      } catch (error) {
        console.error("Post creation error:", error);
        open("error", dict.notifications.postCreationFailed.title, {
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsCreating(false);
      }
    },
  });

  React.useEffect(() => {
    formik.setFieldValue("mediaFiles", mediaFiles);
    if (mediaFiles.length > 0) {
      formik.setFieldTouched("mediaFiles", true);
    }
  }, [mediaFiles]);

  const disabled = useMemo(() => isCreating || creating || !formik.isValid || !formik.dirty, [creating, formik.isValid, formik.dirty, isCreating]);

  if (!user) return null;

  return (
    <div
      className={cn(
        // "bg-background flex flex-col fixed inset-0 z-50 h-full w-full",
        className
      )}
    >
      <div className="p-4 text-center relative">
        <h2 className="text-sm font-bold">Créer une publication</h2>
        {onClose && (
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <Separator />
      <div className="p-4 flex-grow">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage className="object-cover" src={user.profilePicUrl} alt={getUserDisplayName(user)} />
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <TextareaAutosize
            id="content"
            name="content"
            placeholder={
              placeholder || `${dict.post.whatsOnYourMind}, ${getUserDisplayName(user)}?`
            }
            className="min-h-[80px] w-full text-sm rounded-md bg-transparent placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none border-none shadow-none focus-visible:ring-0"
            value={formik.values.content}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </div>
        {formik.touched.content && formik.errors.content && (
          <p className="text-red-500 text-xs mt-1 ml-14">{formik.errors.content}</p>
        )}
      </div>

      {mediaPreviews.length > 0 && (
        <div className="px-4 mb-4 flex-shrink-0">
          <div className={cn("grid gap-2 rounded-lg border p-2", mediaPreviews.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {mediaPreviews.map((preview, index) => (
              <div key={preview.url} className="relative aspect-video">
                {preview.type === MediaType.VIDEO ? (
                  <video src={preview.url} className="w-full h-full object-cover rounded-md" controls />
                ) : preview.type === MediaType.IMAGE ? (
                  <Image src={preview.url} alt={`${dict.post.mediaPreviewAlt} ${index + 1}`} fill className="object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full bg-muted rounded-md flex flex-col items-center justify-center p-2">
                    <FileIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center break-all mt-2">
                      {preview.name}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={() => removeMedia(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 mt-auto border-t">
        <div className="flex items-center justify-around gap-2">
            <label htmlFor="media-upload-mobile" className="cursor-pointer flex flex-col items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
              <ImageIcon className="h-7 w-7 text-green-500" />
              {/* <span className="text-xs">Photo</span> */}
            </label>
            <input id="media-upload-mobile" type="file" multiple className="hidden" accept="image/*,video/mp4,video/quicktime,application/pdf" onChange={handleFileChange} disabled={mediaPreviews.length >= 4} />
            <label htmlFor="media-upload-mobile" className="cursor-pointer flex flex-col items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
              <Video className="h-7 w-7 text-blue-500" />
              {/* <span className="text-sm">Vidéo</span> */}
            </label>
            <label htmlFor="media-upload-mobile" className="cursor-pointer flex flex-col items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
              <FileIcon className="h-7 w-7 text-amber-500" />
              {/* <span className="text-sm">Document</span> */}
            </label>
        </div>
      </div>
      <div className="p-4">
        <Button type="submit" onClick={() => formik.handleSubmit()} disabled={disabled} className="w-full">
          {creating || isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            dict.button.publish
          )}
        </Button>
      </div>
    </div>
  );
}
