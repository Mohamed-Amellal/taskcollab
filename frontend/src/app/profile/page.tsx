"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { getToken, clearToken } from "../../lib/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Loader2, User as UserIcon, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Input";

const ME_QUERY = gql`
	query Me {
		me {
			id
			name
			email
		}
	}
`;

type MeData = {
    me: {
        id: string;
        name: string;
        email: string;
    };
};

export default function ProfilePage() {
    const router = useRouter();
    const token = useMemo(() => getToken(), []);

    // Redirect if not logged in
    if (!token) {
        if (typeof window !== "undefined") {
            router.push("/login");
        }
    }

    const { data, loading, error } = useQuery<MeData>(ME_QUERY, {
        skip: !token,
    });

    const handleLogout = () => {
        clearToken();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !data?.me) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Failed to load profile</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50/50 py-10 px-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        Profile
                    </h1>
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center">
                                <UserIcon className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div>
                                <CardTitle>{data.me.name}</CardTitle>
                                <CardDescription>{data.me.email}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-medium text-zinc-900">Account Details</h3>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Full Name</label>
                                    <Input value={data.me.name} readOnly className="bg-zinc-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Email Address</label>
                                    <Input value={data.me.email} readOnly className="bg-zinc-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">User ID</label>
                                    <Input value={data.me.id} readOnly className="font-mono text-xs bg-zinc-50" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-100">
                            <Button variant="danger" onClick={handleLogout} className="w-full sm:w-auto">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
