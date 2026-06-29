"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { usePostMutations } from "@/hooks/useData/usePostData";
import { Post } from "@/types/Post";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}

export default function EditPostDialog({
  open,
  onOpenChange,
  post,
}: EditPostDialogProps) {
  const dict = useDictionary();
  const { open: notify } = useNotification();
  const { updatePost, updating } = usePostMutations();
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    if (open) {
      setContent(post.content);
    }
  }, [open, post.content]);

  const handleSave = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent === post.content) {
      onOpenChange(false);
      return;
    }

    try {
      await updatePost({
        variables: {
          postId: post.id,
          updatePostInput: { content: trimmedContent },
        },
      });

      notify("success", dict.post.editTitle, {
        message: dict.post.editSuccess,
      });
      onOpenChange(false);
    } catch (error) {
      notify("error", dict.notifications.updateFailed.title, {
        message:
          error instanceof Error
            ? error.message
            : dict.notifications.updateFailed.defaultMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.post.editTitle}</DialogTitle>
          <DialogDescription>{dict.post.editDescription}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={dict.post.editPlaceholder}
          maxLength={2000}
          className="min-h-40"
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {dict.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updating || content.trim().length === 0 || content.trim() === post.content}
          >
            {updating ? <Loader2 className="size-4 animate-spin" /> : dict.button.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
