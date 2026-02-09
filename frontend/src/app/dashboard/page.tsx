"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { clearToken, getToken } from "../../lib/auth";

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
		<div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100">
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
							Dashboard
						</span>
						<h1 className="mt-2 text-3xl font-semibold text-zinc-900">
							Welcome{meData?.me?.name ? `, ${meData.me.name}` : ""}
						</h1>
						<p className="mt-1 text-sm text-zinc-500">
							Manage workspaces, roles, and projects in one place.
						</p>
					</div>
					<button
						className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-zinc-300"
						onClick={handleLogout}
					>
						Log out
					</button>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Workspaces</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{workspaces.length}
						</p>
						<p className="mt-1 text-xs text-zinc-500">
							Active spaces you belong to
						</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Members</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{memberCount}
						</p>
						<p className="mt-1 text-xs text-zinc-500">
							People collaborating with you
						</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Account</p>
						<p className="mt-2 text-sm font-semibold text-zinc-900">
							{meData?.me?.email ?? ""}
						</p>
						<p className="mt-1 text-xs text-zinc-500">
							Signed in profile
						</p>
					</div>
				</div>

				<div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
					<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-zinc-900">Workspaces</h2>
							<span className="text-xs text-zinc-400">{workspaces.length} total</span>
						</div>
						{loading ? (
							<p className="mt-4 text-sm text-zinc-500">Loading...</p>
						) : workspaces.length === 0 ? (
							<div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-6 text-center">
								<p className="text-sm font-medium text-zinc-900">No workspaces yet</p>
								<p className="mt-2 text-xs text-zinc-500">
									Create your first workspace to start collaborating.
								</p>
							</div>
						) : (
							<div className="mt-4 space-y-3">
								{workspaces.map((workspace) => (
									<a
										key={workspace.id}
										href={`/workspaces/${workspace.id}`}
										className="group flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 transition hover:border-zinc-200 hover:bg-zinc-50"
									>
										<div>
											<p className="font-medium text-zinc-900">
												{workspace.name}
											</p>
											<p className="text-xs text-zinc-500">
												Owner: {workspace.owner?.name}
											</p>
										</div>
										<span className="text-xs text-zinc-400 group-hover:text-zinc-600">
											{workspace.members?.length} members
										</span>
									</a>
								))}
							</div>
						)}
					</div>

					<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-zinc-900">
							Create workspace
						</h2>
						<p className="mt-2 text-sm text-zinc-500">
							Start a space for a team or project.
						</p>
						<form className="mt-4 space-y-3" onSubmit={handleCreate}>
							<input
								className="w-full rounded-xl border border-zinc-200 px-3 py-2"
								placeholder="Workspace name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
							<button
								type="submit"
								disabled={creating}
								className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
							>
								{creating ? "Creating..." : "Create workspace"}
							</button>
						</form>
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
