"use client";

import React, { startTransition, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Filter, Search as SearchIcon, Users } from "lucide-react";
import { useGroups } from "@/hooks/useData/useGroups";
import { useDictionary } from "@/hooks/use-dictionary";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GroupPrivacy } from "@/types/Group";
import { cn } from "@/lib/utils";

type SearchFacet = "all" | "people" | "posts" | "groups";

function privacyLabel(privacy: GroupPrivacy, dict: ReturnType<typeof useDictionary>) {
    switch (privacy) {
        case GroupPrivacy.PUBLIC: return dict.groups.form.public;
        case GroupPrivacy.PRIVATE: return dict.groups.form.private;
        case GroupPrivacy.SECRET: return dict.groups.form.secret;
    }
}

const PEOPLE_PREVIEW = [
    {
        initials: "MS",
        name: "Pr. Moussa Sow",
        meta: "Cardiologie interventionnelle · CHU de Fann",
    },
    {
        initials: "FN",
        name: "Dr. Fatou Ndiaye",
        meta: "Anesthésiste-réanimateur · Hôpital principal",
    },
];

const POSTS_PREVIEW = [
    {
        initials: "MS",
        author: "Pr. Moussa Sow",
        time: "4 h",
        content:
            "Nous cherchons à standardiser notre protocole de sortie après angioplastie ambulatoire. Quel délai de surveillance retenez-vous après ponction radiale distale ?",
        stats: "47 réactions · 12 commentaires",
    },
    {
        initials: "CH",
        author: "Clinique de la Madeleine",
        time: "2 j",
        content: "Notre unité d'ambulatoire passe à 40 places en septembre.",
        stats: "18 réactions · 4 commentaires",
    },
];

export default function SearchPage() {
    const dict = useDictionary();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [activeFacet, setActiveFacet] = useState<SearchFacet>("all");
    const deferredQuery = useDeferredValue(query.trim());
    const { groups, loading } = useGroups({ limit: 20, search: deferredQuery || undefined });

    const labels = dict.search;
    const hasQuery = deferredQuery.length > 0;
    const canShowPeople = activeFacet === "all" || activeFacet === "people";
    const canShowPosts = activeFacet === "all" || activeFacet === "posts";
    const canShowGroups = activeFacet === "all" || activeFacet === "groups";
    const availableResultsCount = hasQuery ? groups.length : 0;

    const facets = useMemo(
        () => [
            { value: "all" as const, label: labels.facets.all },
            { value: "people" as const, label: labels.facets.people },
            { value: "posts" as const, label: labels.facets.posts },
            { value: "groups" as const, label: labels.facets.groups },
        ],
        [labels.facets.all, labels.facets.groups, labels.facets.people, labels.facets.posts],
    );

    const handleQueryChange = (value: string) => {
        startTransition(() => {
            setQuery(value);
        });
    };

    return (
        <div className="min-h-screen bg-background pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-10">
            <div className="mx-auto max-w-2xl">
                <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 pb-3 pt-3 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <button type="button" aria-label={dict.actions.back} onClick={() => router.back()} className="shrink-0 md:hidden">
                            <ArrowLeft className="size-5" />
                        </button>
                        <div className="flex h-10 flex-1 items-center gap-2 rounded-field border border-border bg-background px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
                            <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                placeholder={labels.placeholder}
                                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (query) {
                                    setQuery("");
                                    return;
                                }
                                router.back();
                            }}
                            className="text-sm font-semibold text-primary"
                        >
                            {labels.cancel}
                        </button>
                    </div>

                    <div className="-mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
                        {facets.map((facet) => (
                            <button
                                key={facet.value}
                                type="button"
                                onClick={() => setActiveFacet(facet.value)}
                                className={cn(
                                    "h-8 shrink-0 rounded-full border px-3 text-[13px] font-semibold transition-colors",
                                    activeFacet === facet.value
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background text-muted-foreground"
                                )}
                            >
                                {facet.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-semibold text-muted-foreground"
                        >
                            {labels.facets.cardiology}
                        </button>
                        <button
                            type="button"
                            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-semibold text-muted-foreground"
                        >
                            <Filter className="size-3.5" />
                            {labels.facets.filters}
                        </button>
                    </div>
                </header>

                <main className="px-4 py-4">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="font-heading text-[17px] font-semibold tracking-tight">
                            {hasQuery ? labels.resultsCount.replace("{count}", String(availableResultsCount)) : labels.title}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                            {labels.globalReady}
                        </p>
                    </div>

                    {!hasQuery ? (
                        <SearchIntro labels={labels} />
                    ) : (
                        <div className="space-y-4">
                            {canShowPeople && (
                                <PeoplePreviewSection
                                    labels={labels}
                                    query={deferredQuery}
                                />
                            )}

                            {canShowPosts && (
                                <PostsPreviewSection
                                    labels={labels}
                                    query={deferredQuery}
                                />
                            )}

                            {canShowGroups && (
                                <GroupsResultsSection
                                    labels={labels}
                                    dict={dict}
                                    groups={groups}
                                    loading={loading}
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function SearchIntro({ labels }: { labels: ReturnType<typeof useDictionary>["search"] }) {
    return (
        <section className="rounded-card border border-border bg-card p-5 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-field bg-primary-50 text-primary dark:bg-primary-950">
                <SearchIcon className="size-5" />
            </div>
            <h2 className="mt-3 font-heading text-[18px] font-semibold">{labels.startTitle}</h2>
            <p className="mx-auto mt-1 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                {labels.startTyping}
            </p>
        </section>
    );
}

function PeoplePreviewSection({
    labels,
    query,
}: {
    labels: ReturnType<typeof useDictionary>["search"];
    query: string;
}) {
    return (
        <SearchSection title={labels.peopleSectionLabel} note={labels.apiPending}>
            {PEOPLE_PREVIEW.map((person) => (
                <div key={person.name} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                    <Avatar className="size-11 shrink-0">
                        <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">{person.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{highlightText(person.meta, query)}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled className="h-8 rounded-full px-3 text-xs">
                        {labels.follow}
                    </Button>
                </div>
            ))}
        </SearchSection>
    );
}

function PostsPreviewSection({
    labels,
    query,
}: {
    labels: ReturnType<typeof useDictionary>["search"];
    query: string;
}) {
    return (
        <SearchSection title={labels.postsSectionLabel} note={labels.apiPending}>
            {POSTS_PREVIEW.map((post) => (
                <div key={`${post.author}-${post.time}`} className="flex gap-3 border-t border-border px-4 py-3 first:border-t-0">
                    <Avatar shape="establishment" className="size-10 shrink-0">
                        <AvatarFallback>{post.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">
                            {post.author} <span className="font-normal text-muted-foreground">· {post.time}</span>
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-foreground">{highlightText(post.content, query)}</p>
                        <p className="mt-1.5 text-xs font-medium text-muted-foreground">{post.stats}</p>
                    </div>
                </div>
            ))}
        </SearchSection>
    );
}

function GroupsResultsSection({
    labels,
    dict,
    groups,
    loading,
}: {
    labels: ReturnType<typeof useDictionary>["search"];
    dict: ReturnType<typeof useDictionary>;
    groups: ReturnType<typeof useGroups>["groups"];
    loading: boolean;
}) {
    return (
        <SearchSection title={labels.groupsSectionLabel} note={labels.liveData}>
            {loading ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">{dict.common.loading}</p>
            ) : groups.length === 0 ? (
                <div className="px-4 py-6 text-center">
                    <Users className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">{labels.noResults}</p>
                </div>
            ) : (
                groups.map((group) => (
                    <Link
                        key={group._id}
                        href={`/groups/${group.slug}`}
                        className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0"
                    >
                        <Avatar shape="establishment" className="size-11 shrink-0">
                            <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold">{group.name}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {privacyLabel(group.privacy, dict)} · {group.members?.length ?? 0} {dict.groups.members.toLowerCase()}
                            </p>
                        </div>
                    </Link>
                ))
            )}
        </SearchSection>
    );
}

function SearchSection({
    title,
    note,
    children,
}: {
    title: string;
    note: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
                <h2 className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">{title}</h2>
                <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10.5px] font-semibold text-muted-foreground">
                    {note}
                </span>
            </div>
            <div className="overflow-hidden border-y border-border bg-card md:rounded-card md:border">
                {children}
            </div>
        </section>
    );
}

function highlightText(text: string, query: string) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return text;

    const index = text.toLowerCase().indexOf(normalizedQuery.toLowerCase());
    if (index < 0) return text;

    return (
        <>
            {text.slice(0, index)}
            <mark className="rounded-[4px] bg-primary-100 px-0.5 font-semibold text-primary-800 dark:bg-primary-950 dark:text-primary-200">
                {text.slice(index, index + normalizedQuery.length)}
            </mark>
            {text.slice(index + normalizedQuery.length)}
        </>
    );
}
