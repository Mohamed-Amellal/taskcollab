"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";

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
		<div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100">
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<a className="text-sm text-zinc-500" href="/dashboard">
							← Back to dashboard
						</a>
						<h1 className="mt-2 text-3xl font-semibold text-zinc-900">
							{data?.workspace?.name ?? "Workspace"}
						</h1>
						<p className="mt-1 text-sm text-zinc-500">
							Owner: {data?.workspace?.owner?.name}
						</p>
					</div>
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-zinc-500">
						Role: {role}
					</span>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Projects</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{data?.workspace?.projects?.length ?? 0}
						</p>
						<p className="mt-1 text-xs text-zinc-500">Active initiatives</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Members</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{members.length}
						</p>
						<p className="mt-1 text-xs text-zinc-500">People collaborating</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Admin actions</p>
						<p className="mt-2 text-sm font-semibold text-zinc-900">
							{isAdmin ? "Enabled" : "Read only"}
						</p>
						<p className="mt-1 text-xs text-zinc-500">Based on your role</p>
					</div>
				</div>

				<div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
					<div className="space-y-6">
						<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-zinc-900">Projects</h2>
								<span className="text-xs text-zinc-400">
									{data?.workspace?.projects?.length ?? 0} total
								</span>
							</div>
							{loading ? (
								<p className="mt-4 text-sm text-zinc-500">Loading...</p>
							) : (data?.workspace?.projects ?? []).length === 0 ? (
								<div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-center">
									<p className="text-sm font-medium text-zinc-900">No projects yet</p>
									<p className="mt-2 text-xs text-zinc-500">
										Create a project to start managing tasks.
									</p>
								</div>
							) : (
								<div className="mt-4 space-y-3">
									{(data?.workspace?.projects ?? []).map(
										(project: WorkspaceProject) => (
											<a
												key={project.id}
												href={`/projects/${project.id}?workspace=${workspaceId}`}
												className="group flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 transition hover:border-zinc-200 hover:bg-zinc-50"
											>
												<span className="font-medium text-zinc-900">
													{project.name}
												</span>
												<span className="text-xs text-zinc-400 group-hover:text-zinc-600">
													View tasks
												</span>
											</a>
										)
									)}
								</div>
							)}
						</div>

						<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-zinc-900">Members</h2>
							<div className="mt-4 space-y-2">
								{members.map((member) => (
									<div
										key={member.id}
										className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
									>
										<div>
											<p className="text-sm font-medium text-zinc-900">
												{member.user.name}
											</p>
											<p className="text-xs text-zinc-500">
												{member.user.email}
											</p>
										</div>
										<span className="text-xs text-zinc-400">
											{member.role}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{isAdmin && (
							<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
								<h2 className="text-lg font-semibold text-zinc-900">
									Create project
								</h2>
								<p className="mt-2 text-sm text-zinc-500">
									Start a new initiative within this workspace.
								</p>
								<form
									className="mt-4 space-y-3"
									onSubmit={handleCreateProject}
								>
									<input
										className="w-full rounded-xl border border-zinc-200 px-3 py-2"
										placeholder="Project name"
										value={projectName}
										onChange={(e) => setProjectName(e.target.value)}
										required
									/>
									<button
										type="submit"
										disabled={creating}
										className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
									>
										{creating ? "Creating..." : "Create project"}
									</button>
								</form>
							</div>
						)}

						{isAdmin && (
							<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
								<h2 className="text-lg font-semibold text-zinc-900">
									Invite member
								</h2>
								<p className="mt-2 text-sm text-zinc-500">
									Add teammates and set their role.
								</p>
								<form className="mt-4 space-y-3" onSubmit={handleInvite}>
									<input
										className="w-full rounded-xl border border-zinc-200 px-3 py-2"
										placeholder="Email address"
										type="email"
										value={inviteEmail}
										onChange={(e) => setInviteEmail(e.target.value)}
										required
									/>
									<select
										className="w-full rounded-xl border border-zinc-200 px-3 py-2"
										value={inviteRole}
										onChange={(e) => setInviteRole(e.target.value)}
									>
										<option value="MEMBER">Member</option>
										<option value="ADMIN">Admin</option>
									</select>
									<button
										type="submit"
										disabled={inviting}
										className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
									>
										{inviting ? "Inviting..." : "Invite"}
									</button>
								</form>
							</div>
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
