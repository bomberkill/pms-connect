"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import CreatePostComposerMobile from "@/components/CreatePostComposerMobile";
import { useMe } from "@/hooks/useData/useUserData";
import { useDictionary } from "@/hooks/use-dictionary";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { UserTypeGQL } from "@/types/User";

/* Mobile-only "start a post" entry row shown above the feed (mockup B1).
   The FAB in BottomNav opens the same composer — this is a second,
   in-context entry point, not a replacement for it. */
export function FeedComposerEntry() {
  const dict = useDictionary();
  const { me: user } = useMe();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center gap-2.5 rounded-card border border-border bg-card px-3 py-2.5 text-left md:hidden"
      >
        <Avatar
          shape={user.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"}
          className="size-10 shrink-0"
        >
          <AvatarImage className="object-cover" src={user.profilePicUrl} alt={getUserDisplayName(user)} />
          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
        </Avatar>
        <span className="h-10 flex-1 rounded-full border border-border flex items-center px-3.5 text-sm text-muted-foreground">
          {dict.post.whatsOnYourMind}…
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ImageIcon className="size-[19px]" />
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerTitle className="sr-only">{dict.header.addNewPost}</DrawerTitle>
          <CreatePostComposerMobile
            className="w-full max-h-[80vh] overflow-y-auto"
            onCreated={() => setOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
