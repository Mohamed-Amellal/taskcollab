"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken } from "../../lib/auth";
import { ChevronRight, Layout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const ME_QUERY = gql`
	query Me {
		me {
			id
			name
			email
		}
	}
`;

const WORKSPACES_QUERY = gql`
	query Workspaces {
		workspaces {
			id
			name
			createdAt
			owner {
				id
				name
			}
			members {
				id
				role
				user {
					id
					name
				}
			}
		}
	}
`;

const CREATE_WORKSPACE_MUTATION = gql`
	mutation CreateWorkspace($input: CreateWorkspaceInput!) {
		createWorkspace(input: $input) {
			id
			name
			createdAt
		}
	}
`;

export default function DashboardPage() {
	const router = useRouter();
	const token = useMemo(() => getToken(), []);
	const [name, setName] = useState("");

	useEffect(() => {
		if (!token) {
			router.push("/login");
		}
	}, [router, token]);

	const { data: meData } = useQuery<MeData>(ME_QUERY, { skip: !token });
	const { data, loading, refetch } = useQuery<WorkspacesData>(WORKSPACES_QUERY, {
		skip: !token,
	});
	const [createWorkspace, { loading: creating }] = useMutation(
		CREATE_WORKSPACE_MUTATION,
		{
			onCompleted: () => {
				setName("");
				refetch();
			},
		}
	);

	const handleCreate = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!name.trim()) return;
		await createWorkspace({ variables: { input: { name } } });
	};

	const handleLogout = () => {
		clearToken();
		router.push("/login");
	};

	const workspaces: Workspace[] = data?.workspaces ?? [];
	const memberCount = workspaces.reduce(
		(total, workspace) => total + (workspace.members?.length ?? 0),
		0
	);

	return (
		<div className="min-h-screen bg-zinc-50/50">
			<div className="mx-auto max-w-6xl px-6 py-10">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-zinc-900">
							Dashboard
						</h1>
						<p className="mt-1 text-zinc-500">
							Welcome back, {meData?.me?.name?.split(" ")[0]}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="secondary" onClick={() => router.push("/profile")} size="sm">
							Profile
						</Button>
						<Button variant="outline" onClick={handleLogout} size="sm">
							Log out
						</Button>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardDescription>Total Workspaces</CardDescription>
							<CardTitle className="text-2xl">{workspaces.length}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Active spaces you belong to</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Team Members</CardDescription>
							<CardTitle className="text-2xl">{memberCount}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Collaborators across projects</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Account</CardDescription>
							<CardTitle className="text-sm truncate">
								{meData?.me?.email}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Signed in profile</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
					{/* Workspaces List */}
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-zinc-900">
								Your Workspaces
							</h2>
						</div>

						{loading ? (
							<div className="flex items-center justify-center p-12">
								<Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
							</div>
						) : workspaces.length === 0 ? (
							<Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
								<div className="bg-zinc-100 rounded-full p-3 mb-4">
									<Layout className="h-6 w-6 text-zinc-400" />
								</div>
								<h3 className="font-semibold text-zinc-900">No workspaces yet</h3>
								<p className="mt-1 text-sm text-zinc-500 max-w-sm">
									Create your first workspace to start collaborating with your team.
								</p>
							</Card>
						) : (
							<div className="grid gap-4">
								{workspaces.map((workspace) => (
									<a
										key={workspace.id}
										href={`/workspaces/${workspace.id}`}
										className="block group"
									>
										<Card className="transition-all hover:shadow-md hover:border-zinc-200">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-semibold">
														{workspace.name.charAt(0).toUpperCase()}
													</div>
													<div>
														<h3 className="font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
															{workspace.name}
														</h3>
														<p className="text-xs text-zinc-500">
															Owner: {workspace.owner?.name}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="secondary">
														{workspace.members?.length} members
													</Badge>
													<ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
												</div>
											</div>
										</Card>
									</a>
								))}
							</div>
						)}
					</div>

					{/* Create Workspace Sidebar */}
					<div>
						<Card>
							<CardHeader>
								<CardTitle>Create Workspace</CardTitle>
								<CardDescription>
									Start a new space for your team.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleCreate} className="space-y-4">
									<Input
										placeholder="Workspace name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									// removed className="bg-zinc-50" as it's not a standard prop for generic Input anymore or should be passed via className
									/>
									<Button
										type="submit"
										className="w-full"
										isLoading={creating}
									>
										Create Workspace
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

// Icon components (if not already imported globally or available)
// Need to add imports for ChevronRight, Layout, Loader2
type WorkspaceMember = {
	id: string;
	role: string;
	user: {
		id: string;
		name: string;
	};
};

type Workspace = {
	id: string;
	name: string;
	createdAt: string;
	owner: {
		id: string;
		name: string;
	};
	members: WorkspaceMember[];
};

type MeData = {
	me: {
		id: string;
		name: string;
		email: string;
	};
};

type WorkspacesData = {
	workspaces: Workspace[];
};
