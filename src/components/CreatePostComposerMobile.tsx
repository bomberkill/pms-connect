"use client";

import React, { useMemo, useState } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { ChevronDown, Image as ImageIcon, Trash2, Video, FileIcon, Loader2, Plus, Users } from "lucide-react";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { usePostMutations } from "@/hooks/useData/index";
import { MAX_FILE_SIZE, POST_CONTENT_MAX_LENGTH, uploadFileToR2 } from "@/utils/fileUpload";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MediaItem, MediaType } from "@/types/Post";
import { UserTypeGQL } from "@/types/User";
import { cn } from "@/lib/utils";
import { useMediaHandler } from "@/hooks/use-media-handler";
import { CreatePostComposerProps } from "./CreatePostComposer";
import { useMe } from "@/hooks/useData/useUserData";

export default function CreatePostComposerMobile({ onCreated, onClose, placeholder, className, groupId }: CreatePostComposerProps & { groupId?: string }) {
  const dict = useDictionary();
  const { me: user } = useMe();
  const { createPost, creating } = usePostMutations();
  const [isCreating, setIsCreating] = useState(false)
  const { open } = useNotification();
  const router = useRouter();

  const { mediaFiles, mediaPreviews, handleFileChange, removeMedia, resetMedia } = useMediaHandler(4);

  const validationSchema = yup.object({
    content: yup
      .string()
      .required(dict.validation.post.contentRequired)
      .max(POST_CONTENT_MAX_LENGTH, dict.validation.post.contentMax),
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
      .max(4, dict.validation.file.maxFour),
  });

  const formik = useFormik({
    initialValues: {
      content: "",
      mediaFiles: [] as File[],
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!user) return;

      let media: MediaItem[] = [];
      setIsCreating(true);

      try {
        if (mediaFiles.length > 0) {
          const uploadResults = await Promise.all(
            mediaFiles.map((file) => uploadFileToR2(file, "POST_MEDIA"))
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

        const result = await createPost({
          variables: {
            createPostInput: {
              content: values.content,
              media: media.length > 0 ? media : undefined,
              groupId,
            },
          },
        });

        if (result.data?.createPost.status === "PENDING") {
          open("success", dict.groups.postPendingApprovalTitle, { message: dict.groups.postPendingApprovalMessage });
        } else {
          open("success", dict.notifications.postCreated.title, { message: dict.notifications.postCreated.message });
        }
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

  const { setFieldValue, setFieldTouched } = formik;

  React.useEffect(() => {
    setFieldValue("mediaFiles", mediaFiles);
    if (mediaFiles.length > 0) {
      setFieldTouched("mediaFiles", true);
    }
  }, [mediaFiles, setFieldValue, setFieldTouched]);

  const disabled = useMemo(() => isCreating || creating || !formik.isValid || !formik.dirty, [creating, formik.isValid, formik.dirty, isCreating]);

  if (!user) return null;

  return (
    <div
      className={cn(
        // "bg-background flex flex-col fixed inset-0 z-50 h-full w-full",
        className
      )}
    >
      <div className="flex h-[52px] items-center justify-between border-b border-border px-4">
        {onClose ? (
          <Button variant="ghost" size="sm" className="px-0 text-muted-foreground hover:bg-transparent" onClick={onClose}>
            {dict.button.cancel}
          </Button>
        ) : <span />}
        <h2 className="font-heading text-[17px] font-semibold tracking-tight">{dict.post.createPostTitle}</h2>
        <Button size="sm" className="h-8.5 rounded-field px-4" onClick={() => formik.handleSubmit()} disabled={disabled}>
          {creating || isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : dict.button.publish}
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="flex items-center gap-3 px-4 pt-3.5">
          <Avatar shape={user.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"} className="h-10 w-10">
            <AvatarImage className="object-cover" src={user.profilePicUrl} alt={getUserDisplayName(user)} />
            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold leading-tight">{getUserDisplayName(user)}</span>
            <button
              type="button"
              className="mt-1 inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs font-semibold text-muted-foreground"
            >
              <Users className="size-3.5" />
              {dict.common.relations}
              <ChevronDown className="size-3" />
            </button>
          </div>
        </div>
        <div className="px-4 pt-4">
          <div className="flex w-full flex-col gap-1">
            <TextareaAutosize
              id="content"
              name="content"
              placeholder={
                placeholder || `${dict.post.whatsOnYourMind}, ${getUserDisplayName(user)}?`
              }
              className="min-h-[132px] w-full resize-none border-none bg-transparent px-0 text-base leading-[1.55] placeholder:text-muted-foreground shadow-none focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              value={formik.values.content}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>
        </div>
        {formik.touched.content && formik.errors.content && (
          <p className="text-destructive text-xs mt-1 px-4">{formik.errors.content}</p>
        )}

        {mediaPreviews.length > 0 && (
          <div className="px-4 pb-4 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
            {mediaPreviews.map((preview, index) => (
              <div key={preview.url} className="relative size-24 shrink-0">
                {preview.type === MediaType.VIDEO ? (
                  <video src={preview.url} className="w-full h-full object-cover rounded-field" controls />
                ) : preview.type === MediaType.IMAGE ? (
                  <Image src={preview.url} alt={`${dict.post.mediaPreviewAlt} ${index + 1}`} fill className="object-cover rounded-field" />
                ) : (
                  <div className="w-full h-full bg-muted rounded-field border border-border flex flex-col items-center justify-center p-1">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-2xs text-muted-foreground text-center break-all mt-1 line-clamp-2">
                      {preview.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  aria-label={dict.actions.delete}
                  className="absolute top-1 right-1 size-5.5 rounded-full bg-black/60 hover:bg-black/75 flex items-center justify-center"
                  onClick={() => removeMedia(index)}
                >
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
            {mediaPreviews.length < 4 && (
              <label
                htmlFor="media-upload-mobile"
                className="flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-field border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="text-2xs font-medium">{dict.button.add}</span>
              </label>
            )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-border p-2 flex items-center gap-1">
        <label htmlFor="media-upload-mobile" className="flex size-10.5 cursor-pointer items-center justify-center rounded-button text-primary hover:bg-muted transition-colors">
          <ImageIcon className="h-5 w-5" />
        </label>
        <input id="media-upload-mobile" type="file" multiple className="hidden" accept="image/*,video/mp4,video/quicktime,application/pdf" onChange={handleFileChange} disabled={mediaPreviews.length >= 4} />
        <label htmlFor="media-upload-mobile" className="flex size-10.5 cursor-pointer items-center justify-center rounded-button text-primary hover:bg-muted transition-colors">
          <Video className="h-5 w-5" />
        </label>
        <label htmlFor="media-upload-mobile" className="flex size-10.5 cursor-pointer items-center justify-center rounded-button text-primary hover:bg-muted transition-colors">
          <FileIcon className="h-5 w-5" />
        </label>
        <span className={cn(
          "ml-auto font-mono text-xs tabular-nums text-muted-foreground",
          formik.values.content.length > POST_CONTENT_MAX_LENGTH && "text-destructive"
        )}>
          {formik.values.content.length} / {POST_CONTENT_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
