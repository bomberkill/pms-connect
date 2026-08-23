"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search as SearchIcon, Users } from "lucide-react";
import { useGroups } from "@/hooks/useData/useGroups";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { GroupPrivacy } from "@/types/Group";

function privacyLabel(privacy: GroupPrivacy, dict: ReturnType<typeof useDictionary>) {
    switch (privacy) {
        case GroupPrivacy.PUBLIC: return dict.groups.form.public;
        case GroupPrivacy.PRIVATE: return dict.groups.form.private;
        case GroupPrivacy.SECRET: return dict.groups.form.secret;
    }
}

export default function SearchPage() {
    const dict = useDictionary();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const { groups, loading } = useGroups({ limit: 20, search: query || undefined });

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button type="button" aria-label={dict.actions.back} onClick={() => router.back()} className="shrink-0 md:hidden">
                    <ArrowLeft className="size-5" />
                </button>
                <div className="flex-1 h-10 rounded-full border border-border flex items-center gap-2 px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
                    <SearchIcon className="size-[18px] text-muted-foreground shrink-0" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={dict.search.placeholder}
                        className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="px-4 py-2">
                {/* Real, working search: groups only (getGroups is the only search-shaped
                    query the API exposes today — no user/post search endpoint exists). */}
                <h2 className="mt-3 mb-1 font-mono text-2xs uppercase tracking-wider text-muted-foreground">
                    {dict.search.groupsSectionLabel}
                </h2>

                {!query ? (
                    <p className="py-6 text-sm text-muted-foreground text-center">{dict.search.startTyping}</p>
                ) : loading ? (
                    <p className="py-6 text-sm text-muted-foreground text-center">{dict.common.loading}</p>
                ) : groups.length === 0 ? (
                    <EmptyState icon={Users} title={dict.search.noResults} />
                ) : (
                    <div className="bg-card border-y border-border">
                        {groups.map((group) => (
                            <Link
                                key={group._id}
                                href={`/groups/${group.slug}`}
                                className="flex items-center gap-3 px-2 py-3 border-t border-border first:border-t-0"
                            >
                                <Avatar shape="establishment" className="size-11 shrink-0">
                                    <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-[15px] truncate">{group.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {privacyLabel(group.privacy, dict)} · {group.members?.length ?? 0} {dict.groups.members.toLowerCase()}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    {dict.search.peoplePostsComingSoon}
                </p>
            </div>
        </div>
    );
}
