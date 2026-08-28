"use client";

import { AlertTriangle, ChevronRight, MessageCircle, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/hooks/use-dictionary";
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { Group } from "@/types/Group";
import { Post } from "@/types/Post";

interface PendingGroupPostsPanelProps {
    group: Group;
    posts: Post[];
    actionLoading: boolean;
    settingsLoading?: boolean;
    canDelete?: boolean;
    onApprove: (postId: string) => Promise<void>;
    onReject: (postId: string) => Promise<void>;
    onTogglePostsRequireApproval: (checked: boolean) => Promise<void>;
    onToggleRestrictToVerifiedTitles: (checked: boolean) => Promise<void>;
    onOpenSettings: () => void;
    onDeleteGroup?: () => void;
}

function AdminSwitch({
    checked,
    disabled,
    onChange,
}: {
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                checked ? "bg-primary" : "bg-muted",
                disabled && "opacity-60"
            )}
        >
            <span
                className={cn(
                    "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    );
}

function AdminRow({
    title,
    subtitle,
    icon: Icon,
    children,
    destructive,
    onClick,
}: {
    title: string;
    subtitle?: string;
    icon?: typeof ShieldCheck;
    children?: React.ReactNode;
    destructive?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none"
            disabled={!onClick && !children}
        >
            {Icon && (
                <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    destructive ? "bg-destructive/10 text-destructive" : "bg-primary-50 text-primary dark:bg-primary-950"
                )}>
                    <Icon className="size-4" strokeWidth={2} />
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span className={cn("block text-[15px] font-semibold leading-tight", destructive && "text-destructive")}>
                    {title}
                </span>
                {subtitle && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{subtitle}</span>}
            </span>
            {children ?? <ChevronRight className="size-4 text-muted-foreground" />}
        </button>
    );
}

function formatPostTime(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function PendingGroupPostsPanel({
    group,
    posts,
    actionLoading,
    settingsLoading,
    canDelete,
    onApprove,
    onReject,
    onTogglePostsRequireApproval,
    onToggleRestrictToVerifiedTitles,
    onOpenSettings,
    onDeleteGroup,
}: PendingGroupPostsPanelProps) {
    const dict = useDictionary();
    const rulesCount = group.rules?.length ?? 0;

    return (
        <section className="overflow-hidden rounded-[24px] border border-border bg-card shadow-xs">
            <div className="border-b border-border px-4 py-4">
                <p className="font-heading text-[17px] font-semibold tracking-[-0.02em]">{dict.groups.adminTitle}</p>
                <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">{group.name}</p>
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{dict.groups.pendingPostsSection}</h3>
                <span className="text-[12.5px] font-semibold text-primary">
                    {dict.groups.pendingPostsCount.replace("{count}", String(posts.length))}
                </span>
            </div>

            <div className="space-y-3 px-4 pb-5">
                {posts.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
                        <p className="text-sm font-medium text-foreground">{dict.groups.noPendingPosts}</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <article key={post.id} className="rounded-[20px] border border-border bg-background/80 p-3.5 shadow-xs">
                            <div className="flex items-start gap-3">
                                <Avatar className="size-10 shrink-0">
                                    <AvatarImage src={post.author.profilePicUrl} />
                                    <AvatarFallback>{getUserInitials(post.author)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[14px] font-semibold leading-tight">{getUserDisplayName(post.author)}</p>
                                            {post.createdAt && (
                                                <p className="mt-0.5 text-[11.5px] text-muted-foreground">{formatPostTime(post.createdAt)}</p>
                                            )}
                                        </div>
                                            <button
                                                type="button"
                                                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                            aria-label={dict.groups.openPostDiscussion}
                                            >
                                            <MessageCircle className="size-4" strokeWidth={1.9} />
                                        </button>
                                    </div>
                                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                                        {post.content}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <Button size="sm" className="h-9 flex-1 rounded-full text-[13px]" onClick={() => onApprove(post.id)} disabled={actionLoading}>
                                    {dict.groups.approvePost}
                                </Button>
                                <Button size="sm" variant="outline" className="h-9 flex-1 rounded-full text-[13px]" onClick={() => onReject(post.id)} disabled={actionLoading}>
                                    {dict.groups.rejectPost}
                                </Button>
                            </div>
                        </article>
                    ))
                )}
            </div>

            <div className="border-t border-border">
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{dict.groups.reportsSection}</h3>
                </div>
                <AdminRow
                    icon={AlertTriangle}
                    title={dict.groups.reportedPostsUnavailable}
                    subtitle={dict.groups.reportedPostsUnavailableDesc}
                />
            </div>

            <div className="border-t border-border">
                <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{dict.groups.settingsSection}</h3>
                </div>
                <AdminRow
                    title={dict.groups.requirePostApprovalTitle}
                    subtitle={dict.groups.requirePostApprovalDesc.replace("{count}", String(posts.length))}
                    icon={ShieldCheck}
                >
                    <AdminSwitch
                        checked={group.postsRequireApproval}
                        disabled={settingsLoading}
                        onChange={onTogglePostsRequireApproval}
                    />
                </AdminRow>
                <AdminRow
                    title={dict.groups.restrictVerifiedTitle}
                    subtitle={dict.groups.restrictVerifiedDesc}
                    icon={ShieldCheck}
                >
                    <AdminSwitch
                        checked={group.restrictToVerifiedTitles}
                        disabled={settingsLoading}
                        onChange={onToggleRestrictToVerifiedTitles}
                    />
                </AdminRow>
                <AdminRow title={dict.groups.editNameDescription} icon={Pencil} onClick={onOpenSettings} />
                <AdminRow
                    title={dict.groups.rulesTitle}
                    subtitle={dict.groups.rulesCount.replace("{count}", String(rulesCount))}
                    icon={Pencil}
                    onClick={onOpenSettings}
                />
                {canDelete && onDeleteGroup && (
                    <AdminRow title={dict.groups.delete} icon={Trash2} destructive onClick={onDeleteGroup} />
                )}
            </div>
        </section>
    );
}
