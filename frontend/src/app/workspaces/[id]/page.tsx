"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
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
		}
	}
`;

const WORKSPACE_QUERY = gql`
	query Workspace($id: ID!) {
		workspace(id: $id) {
			id
			name
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
					email
				}
			}
			projects {
				id
				name
				createdAt
			}
		}
	}
`;

const CREATE_PROJECT_MUTATION = gql`
	mutation CreateProject($input: CreateProjectInput!) {
		createProject(input: $input) {
			id
			name
			createdAt
		}
	}
`;

const INVITE_MUTATION = gql`
	mutation InviteUserToWorkspace($input: InviteUserInput!) {
		inviteUserToWorkspace(input: $input) {
			id
			role
			user {
				id
				name
				email
			}
		}
	}
`;

export default function WorkspacePage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const token = useMemo(() => getToken(), []);
	const workspaceId = params?.id;

	useEffect(() => {
		if (!token) {
			router.push("/login");
		}
	}, [router, token]);

	const { data: meData } = useQuery<MeData>(ME_QUERY, { skip: !token });
	const { data, loading, refetch } = useQuery<WorkspaceData>(WORKSPACE_QUERY, {
		variables: { id: workspaceId },
		skip: !token || !workspaceId,
	});
	const [createProject, { loading: creating }] = useMutation(
		CREATE_PROJECT_MUTATION,
		{
			onCompleted: () => refetch(),
		}
	);
	const [inviteUser, { loading: inviting }] = useMutation(INVITE_MUTATION, {
		onCompleted: () => refetch(),
	});

	const [projectName, setProjectName] = useState("");
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("MEMBER");

	const members: WorkspaceMember[] = data?.workspace?.members ?? [];
	const currentUserId = meData?.me?.id;
	const currentMembership = members.find(
		(member) => member.user.id === currentUserId
	);
	const role = currentMembership?.role ?? "MEMBER";
	const isAdmin = role === "ADMIN" || role === "OWNER";

	const handleCreateProject = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!projectName.trim()) return;
		await createProject({
			variables: { input: { name: projectName, workspaceId } },
		});
		setProjectName("");
	};

	const handleInvite = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!inviteEmail.trim()) return;
		await inviteUser({
			variables: {
				input: { workspaceId, email: inviteEmail, role: inviteRole },
			},
		});
		setInviteEmail("");
	};

	return (
		<div className="min-h-screen bg-zinc-50/50">
			<div className="mx-auto max-w-6xl px-6 py-10">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
							<a href="/dashboard" className="hover:text-zinc-900 transition-colors">
								Dashboard
							</a>
							<ChevronRight className="h-4 w-4" />
							<span>Workspace</span>
						</div>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold tracking-tight text-zinc-900">
								{data?.workspace?.name ?? "Workspace"}
							</h1>
							<Badge variant="outline">{role}</Badge>
						</div>
						<p className="mt-1 text-zinc-500">
							Owner: {data?.workspace?.owner?.name}
						</p>
					</div>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardDescription>Active Projects</CardDescription>
							<CardTitle className="text-2xl">
								{data?.workspace?.projects?.length ?? 0}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Ongoing initiatives</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Team Members</CardDescription>
							<CardTitle className="text-2xl">{members.length}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Active collaborators</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardDescription>Admin Rights</CardDescription>
							<CardTitle className="text-sm font-semibold">
								{isAdmin ? "Full Access" : "Limited Access"}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-xs text-zinc-500">Based on your role</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
					<div className="space-y-6">
						{/* Projects List */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-zinc-900">Projects</h2>
							</div>

							{loading ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
								</div>
							) : (data?.workspace?.projects ?? []).length === 0 ? (
								<Card className="border-dashed py-12 flex flex-col items-center text-center">
									<div className="bg-zinc-100 rounded-full p-3 mb-4">
										<Layout className="h-6 w-6 text-zinc-400" />
									</div>
									<p className="font-medium text-zinc-900">No projects yet</p>
									<p className="text-sm text-zinc-500 mt-1 max-w-xs">
										Get started by creating a new project for your team.
									</p>
								</Card>
							) : (
								<div className="grid gap-4">
									{(data?.workspace?.projects ?? []).map(
										(project: WorkspaceProject) => (
											<a
												key={project.id}
												href={`/projects/${project.id}?workspace=${workspaceId}`}
												className="block group"
											>
												<Card className="transition-all hover:shadow-md hover:border-zinc-200">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-4">
															<div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold">
																{project.name.charAt(0).toUpperCase()}
															</div>
															<div>
																<h3 className="font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
																	{project.name}
																</h3>
																<p className="text-xs text-zinc-500">
																	Created {new Date(Number(project.createdAt)).toLocaleDateString()}
																</p>
															</div>
														</div>
														<ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
													</div>
												</Card>
											</a>
										)
									)}
								</div>
							)}
						</div>

						{/* Members List */}
						<Card>
							<CardHeader>
								<CardTitle>Members</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-3">
												<div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600">
													{member.user.name.charAt(0)}
												</div>
												<div>
													<p className="text-sm font-medium text-zinc-900">
														{member.user.name}
													</p>
													<p className="text-xs text-zinc-500">
														{member.user.email}
													</p>
												</div>
											</div>
											<Badge variant={member.role === 'OWNER' ? 'default' : member.role === 'ADMIN' ? 'secondary' : 'outline'}>
												{member.role}
											</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-6">
						{isAdmin && (
							<>
								<Card>
									<CardHeader>
										<CardTitle>Create Project</CardTitle>
										<CardDescription>
											Start a new initiative.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleCreateProject} className="space-y-4">
											<Input
												placeholder="Project name"
												value={projectName}
												onChange={(e) => setProjectName(e.target.value)}
												required
											/>
											<Button
												type="submit"
												className="w-full"
												isLoading={creating}
											>
												Create Project
											</Button>
										</form>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Invite Member</CardTitle>
										<CardDescription>
											Add teammates to this workspace.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleInvite} className="space-y-4">
											<Input
												placeholder="Email address"
												type="email"
												value={inviteEmail}
												onChange={(e) => setInviteEmail(e.target.value)}
												required
											/>
											<div className="space-y-2">
												<label className="text-sm font-medium leading-none text-zinc-700">
													Role
												</label>
												<select
													className="flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
													value={inviteRole}
													onChange={(e) => setInviteRole(e.target.value)}
												>
													<option value="MEMBER">Member</option>
													<option value="ADMIN">Admin</option>
												</select>
											</div>
											<Button
												type="submit"
												variant="secondary"
												className="w-full"
												isLoading={inviting}
											>
												Send Invite
											</Button>
										</form>
									</CardContent>
								</Card>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

type WorkspaceMember = {
	id: string;
	role: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
};

type WorkspaceProject = {
	id: string;
	name: string;
	createdAt: string;
};

type WorkspaceData = {
	workspace: {
		id: string;
		name: string;
		owner: {
			id: string;
			name: string;
		};
		members: WorkspaceMember[];
		projects: WorkspaceProject[];
	};
};

type MeData = {
	me: {
		id: string;
		name: string;
	};
};
