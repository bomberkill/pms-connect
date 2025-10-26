 "use client";
 
 import React, { useState } from "react";
 import { useDictionary } from "@/lib/hooks";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
 import { Button } from "@/components/ui/button";
 import { FileIcon, Loader2, Paperclip, Send, SmilePlus, Trash2 } from "lucide-react";
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
 };
 
 export default function CommentComposer({ user, placeholder, isSubmitting, onSubmit }: CommentComposerProps) {
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
     <div className="flex items-start gap-3 w-full">
       <Avatar className="h-8 w-8">
         <AvatarImage src={user?.profilePicUrl || ""} />
         <AvatarFallback>{user ? getUserInitials(user) : "U"}</AvatarFallback>
       </Avatar>
       <form onSubmit={handleSubmit} className="flex-1">
         <div className="bg-muted/40 border rounded-2xl px-3 py-2">
           {mediaPreviews.length > 0 && (
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
               {mediaPreviews.map((preview, index) => (
                 <div key={preview.url} className="relative w-full rounded-lg border overflow-hidden aspect-video">
                   {preview.type === MediaType.VIDEO ? (
                     <video src={preview.url} className="w-full h-auto max-h-40 object-cover" controls />
                   ) : preview.type === MediaType.IMAGE ? (
                     <Image src={preview.url} alt="Media preview" width={200} height={200} className="object-cover w-full h-auto max-h-40" />
                   ) : (
                    <div className="w-full h-full bg-muted rounded-md flex flex-col items-center justify-center p-2">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center break-all mt-1">{preview.name}</span>
                    </div>
                   )}
                   <Button
                     type="button"
                     variant="destructive"
                     size="icon"
                     className="absolute top-1 right-1 h-6 w-6 rounded-full"
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
             className="border-none shadow-none text-sm focus-visible:ring-0 outline-none w-full bg-transparent resize-none"
             maxRows={8}
           />
           <div className="flex items-center justify-between mt-1">
             <div className="flex items-center gap-3">
               <Popover>
                 <PopoverTrigger asChild>
                     <SmilePlus className="h-5 w-5 text-muted-foreground cursor-pointer" />
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0 border-none">
                   <Picker onEmojiClick={(emojiObject) => setContent(prev => prev + emojiObject.emoji)} />
                 </PopoverContent>
               </Popover>
               <label htmlFor="comment-media-upload" className="cursor-pointer">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
               </label>
               <input id="comment-media-upload" type="file" multiple className="hidden" accept="image/*,video/*,application/pdf" onChange={handleFileChange} disabled={mediaPreviews.length >= 4} />
             </div>
             <Button type="submit" size="icon" className="rounded-full h-8 w-8" disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}>
              {!isSubmitting ? 
               <Send className="h-4 w-4" /> 
               : 
               <Loader2 className="h-4 w-4"/>
              }
             </Button>
           </div>
         </div>
       </form>
     </div>
   );
 }