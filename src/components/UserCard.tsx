import { User, UserTypeGQL } from "@/types/User";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import Link from "next/link";
import { Button } from "./ui/button";
import { useConnectionActions, useFollowActions } from "../hooks/useData/index";
import { Plus, X } from "lucide-react";

interface UserCardProps {
    friend: User;
    isRequest?: "requester" | "recipient"
    requestId?: string;
}
export default function UserCard ({friend, isRequest, requestId}:UserCardProps) {
    const {followUser} = useFollowActions()
    const {acceptRequest, declineRequest, } = useConnectionActions()
    return (
        <Card className="p-3 flex flex-col items-center text-center">
            <Avatar className="h-15 w-15 sm:h-20 sm:w-20 rounded-full">
                <AvatarImage
                    src={friend.profilePicUrl}
                    alt={getUserDisplayName(friend)}
                    className="object-cover"
                />
                <AvatarFallback>{getUserInitials(friend)}</AvatarFallback>
            </Avatar>
            <CardContent className="p-0 w-full">
                <Link href={`/profile/${friend.slug}`}>
                    <h3 className="text-sm font-medium hover:underline truncate">
                        {getUserDisplayName(friend)}
                    </h3>
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                    {friend.userType === UserTypeGQL.INDIVIDUAL
                    ? friend.professionalTitle
                    : friend.entityType}
                </p>

                {/* Boutons selon le type de relation */}
                <div className="flex justify-center gap-2 mt-2">
                    {isRequest ? (
                        <div>
                            {isRequest === "recipient" ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        className="cursor-pointer"
                                        onClick={() => declineRequest({variables: {requestId: requestId ?? ''}})}
                                        size="icon"
                                        variant="outline"
                                    >
                                        <X/>
                                    </Button>
                                    <Button
                                        className="cursor-pointer"
                                        onClick={() => acceptRequest({variables: {requestId: requestId ?? ''}})}
                                        size="icon"
                                        variant="default"
                                    >
                                        <Plus/>
                                    </Button>

                                </div>
                            ) : (
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => declineRequest({variables: {requestId: requestId ?? ''}})}
                                    size="sm"
                                    variant="outline"
                                >
                                    Annuler
                                </Button>
                            )}

                        </div>
                    ) : (
                        
                        <Button
                            className="cursor-pointer"
                            onClick={() => followUser({ variables: { userId: friend.id } })}
                            size="sm"
                            variant="default"
                        >
                            Suivre
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}