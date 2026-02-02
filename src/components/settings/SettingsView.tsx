"use client";

import React, { useState } from "react";
import { useDictionary } from "@/hooks/use-dictionary";
import { useMe } from "@/hooks/useData/useUserData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@apollo/client";
import { buildUpdateMyEmailMutation } from "@/graphql/queries/user";
import { toast } from "sonner";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
    Loader2,
    User,
    ShieldCheck,
    Settings2,
    LogOut,
    Mail,
    Lock,
    Languages,
    Moon,
    Sun,
    Monitor,
    Camera,
    Check
} from "lucide-react";
import { User as UserType } from "@/types/User";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials, getUserDisplayName } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export default function SettingsView() {
    const dict = useDictionary();
    const { me, loading } = useMe();
    const router = useRouter();

    if (loading || !me) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const navigationItems = [
        { value: "account", label: dict.settings.tabs.account, icon: User },
        { value: "security", label: dict.settings.tabs.security, icon: ShieldCheck },
        { value: "preferences", label: dict.settings.tabs.preferences, icon: Settings2 },
    ];

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 md:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{dict.settings.title}</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {dict.updateProfile.description}
                </p>
            </div>

            <Tabs defaultValue="account" className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-64 flex-shrink-0 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                    <TabsList className="flex flex-row lg:flex-col h-auto w-full justify-start gap-2 bg-transparent p-0 min-w-max lg:min-w-0">
                        {navigationItems.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={item.value}
                                className="w-full justify-start px-4 py-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                            >
                                <item.icon className="w-4 h-4 mr-3" />
                                {item.label}
                            </TabsTrigger>
                        ))}
                        <Button
                            variant="ghost"
                            className="w-full justify-start px-4 py-3 h-auto text-destructive hover:text-destructive hover:bg-destructive/10 mt-auto lg:mt-4"
                            onClick={() => {
                                signOut(auth);
                                router.push("/login");
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            {dict.appSideBar.navUser.logout}
                        </Button>
                    </TabsList>
                </aside>

                <div className="flex-1 space-y-8">
                    <TabsContent value="account" className="mt-0 space-y-8">
                        <AccountSettings me={me} />
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 space-y-8">
                        <SecuritySettings email={me.email} />
                    </TabsContent>

                    <TabsContent value="preferences" className="mt-0 space-y-8">
                        <PreferencesSettings />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function AccountSettings({ me }: { me: UserType }) {
    const dict = useDictionary();
    const [email, setEmail] = useState(me.email);
    const [isEditing, setIsEditing] = useState(false);

    const UPDATE_EMAIL_MUTATION = buildUpdateMyEmailMutation();
    const [updateEmail, { loading }] = useMutation(UPDATE_EMAIL_MUTATION);

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateEmail({ variables: { newEmail: email } });
            toast.success(dict.notifications.emailUpdated.title);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error(dict.notifications.updateFailed.defaultMessage);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle>{dict.settings.sections.profileInfo}</CardTitle>
                    <CardDescription>{dict.settings.sections.profileDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b">
                        <div className="relative group cursor-pointer">
                            <Avatar className="w-24 h-24 border-4 border-background shadow-sm">
                                <AvatarImage src={me.profilePicUrl} className="object-cover" />
                                <AvatarFallback className="text-xl">{getUserInitials(me)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-1">
                            <h3 className="font-semibold text-lg">{getUserDisplayName(me)}</h3>
                            <p className="text-sm text-muted-foreground">{me.email}</p>
                            <p className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-full inline-block mt-2">
                                {me.userType === "INDIVIDUAL" ? dict.register.individual : dict.register.legalEntity}
                            </p>
                        </div>
                        <Button variant="outline" size="sm">{dict.button.edit}</Button>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>{dict.settings.labels.displayName}</Label>
                            <div className="relative">
                                { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                <Input disabled value={(me as any).firstName ? `${(me as any).firstName} ${(me as any).lastName}` : (me as any).entityName} className="bg-muted/50 pl-10" />
                                <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                            </div>
                            <p className="text-[13px] text-muted-foreground">{dict.settings.labels.managedVia}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle>{dict.settings.sections.contactInfo}</CardTitle>
                    <CardDescription>{dict.settings.sections.contactDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{dict.settings.labels.emailAddress}</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!isEditing}
                                        className={cn("pl-10", isEditing ? "bg-background" : "bg-muted/50")}
                                    />
                                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                </div>
                                {!isEditing ? (
                                    <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                                        {dict.button.edit}
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={loading}>
                                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            {dict.button.save}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => {
                                            setIsEditing(false);
                                            setEmail(me.email);
                                        }}>
                                            {dict.button.cancel}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function SecuritySettings({ email }: { email: string }) {
    const dict = useDictionary();
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success(dict.notifications.forgotPassword.success.title);
        } catch (e: unknown) {
            toast.error((e as Error).message || dict.globalErrors.default);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle>{dict.settings.sections.password}</CardTitle>
                    <CardDescription>{dict.settings.sections.passwordDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">{dict.settings.labels.changePassword}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">{dict.settings.labels.resetEmailSent}</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handlePasswordReset} disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {dict.button.sendLink}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PreferencesSettings() {
    const dict = useDictionary();
    const currentLang = typeof window !== 'undefined' && window.location.pathname.startsWith('/fr') ? 'fr' : 'en';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        {dict.settings.sections.language}
                    </CardTitle>
                    <CardDescription>{dict.settings.sections.languageDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            className={cn(
                                "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50 relative",
                                currentLang === "en" ? "border-primary bg-primary/5" : "border-border"
                            )}
                            onClick={() => window.location.href = '/en/settings'}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🇺🇸</span>
                                    <div>
                                        <div className="font-semibold">English</div>
                                        <div className="text-sm text-muted-foreground">United States</div>
                                    </div>
                                </div>
                                {currentLang === "en" && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>}
                            </div>
                        </div>

                        <div
                            className={cn(
                                "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50 relative",
                                currentLang === "fr" ? "border-primary bg-primary/5" : "border-border"
                            )}
                            onClick={() => window.location.href = '/fr/settings'}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🇫🇷</span>
                                    <div>
                                        <div className="font-semibold">Français</div>
                                        <div className="text-sm text-muted-foreground">France</div>
                                    </div>
                                </div>
                                {currentLang === "fr" && <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="opacity-75">
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="w-5 h-5" />
                        {dict.settings.sections.theme}
                    </CardTitle>
                    <CardDescription>{dict.settings.sections.appearance}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-3 gap-4 pointer-events-none grayscale opacity-60">
                        <div className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-card">
                            <Sun className="w-6 h-6" />
                            <span className="text-sm font-medium">{dict.settings.sections.light}</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-slate-950 text-white">
                            <Moon className="w-6 h-6" />
                            <span className="text-sm font-medium">{dict.settings.sections.dark}</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-muted">
                            <Monitor className="w-6 h-6" />
                            <span className="text-sm font-medium">{dict.settings.sections.system}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
