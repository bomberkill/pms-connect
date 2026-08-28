"use client";

import React, { useState } from "react";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileIcon, Loader2, Paperclip, Send, SmilePlus, Trash2, X } from "lucide-react";
import { User } from "@/types/User";
import { getUserInitials } from "@/lib/user-utils";
import TextareaAutosize from "react-textarea-autosize";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Picker from "emoji-picker-react";
import Image from "next/image";
import { useMediaHandler } from "@/hooks/use-media-handler";
import { MediaType } from "@/types/Post";

type CommentComposerProps = {
  user: User | null;
  placeholder?: string;
  isSubmitting?: boolean;
  onSubmit: (content: string, files?: File[]) => Promise<void>;
  replyingTo?: { label: string };
  onCancelReply?: () => void;
};

export default function CommentComposer({ user, placeholder, isSubmitting, onSubmit, replyingTo, onCancelReply }: CommentComposerProps) {
  const dict = useDictionary();
  const [content, setContent] = useState("");
  const { mediaFiles, mediaPreviews, handleFileChange, removeMedia, resetMedia } = useMediaHandler(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && mediaFiles.length === 0) || isSubmitting) return;

    await onSubmit(content, mediaFiles);

    // Reset state after successful submission
    setContent("");
    resetMedia();
  };

  return (
    <div className="flex w-full items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user?.profilePicUrl || ""} />
        <AvatarFallback>{user ? getUserInitials(user) : "U"}</AvatarFallback>
      </Avatar>
      <form onSubmit={handleSubmit} className="min-w-0 flex-1">
        <div className="rounded-card border border-border bg-card px-3 py-2 shadow-xs">
          {replyingTo && (
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
              <span>{dict.post.replyingTo} <span className="text-primary font-medium">{replyingTo.label}</span></span>
              {onCancelReply && (
                <button
                  type="button"
                  onClick={onCancelReply}
                  aria-label={dict.post.cancelReply}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
          {mediaPreviews.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {mediaPreviews.map((preview, index) => (
                <div key={preview.url} className="relative size-20 shrink-0 overflow-hidden rounded-field border border-border">
                  {preview.type === MediaType.VIDEO ? (
                    <video src={preview.url} className="h-full w-full object-cover" controls />
                  ) : preview.type === MediaType.IMAGE ? (
                    <Image src={preview.url} alt="Media preview" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-1.5">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                      <span className="mt-1 line-clamp-2 break-all text-center text-2xs text-muted-foreground">{preview.name}</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 size-5 rounded-full bg-black/60 text-white hover:bg-black/75 hover:text-white"
                    onClick={() => removeMedia(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <TextareaAutosize
            name="comment"
            placeholder={placeholder || dict.post.whatsOnYourMind}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none border-none bg-transparent text-[15px] leading-relaxed shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            maxRows={8}
          />
          <div className="mt-1 flex min-w-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full hover:bg-muted/50">
                    <SmilePlus className="size-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none">
                  <Picker onEmojiClick={(emojiObject) => setContent(prev => prev + emojiObject.emoji)} />
                </PopoverContent>
              </Popover>
              <label htmlFor="comment-media-upload" className="cursor-pointer text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-full hover:bg-muted/50">
                <Paperclip className="size-5" />
              </label>
              <input id="comment-media-upload" type="file" multiple className="hidden" accept="image/*,video/*,application/pdf" onChange={handleFileChange} disabled={mediaPreviews.length >= 4} />
            </div>
            <Button type="submit" size="icon" className="size-8 shrink-0 rounded-full" disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}>
              {!isSubmitting ?
                <Send className="size-4" />
                :
                <Loader2 className="size-4 animate-spin" />
              }
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
