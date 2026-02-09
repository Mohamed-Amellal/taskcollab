"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

const TASKS_QUERY = gql`
	query Tasks($projectId: ID!) {
		tasks(projectId: $projectId) {
			id
			title
			description
			status
			priority
			assignedTo {
				id
				name
			}
			createdAt
			updatedAt
			project {
				id
				name
				workspace {
					id
					name
				}
			}
		}
	}
`;

const WORKSPACE_QUERY = gql`
	query Workspace($id: ID!) {
		workspace(id: $id) {
			id
			name
			members {
				id
				role
				user {
					id
					name
					email
				}
			}
		}
	}
`;

const CREATE_TASK_MUTATION = gql`
	mutation CreateTask($input: CreateTaskInput!) {
		createTask(input: $input) {
			id
		}
	}
`;

const UPDATE_STATUS_MUTATION = gql`
	mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
		updateTaskStatus(input: $input) {
			id
			status
		}
	}
`;

const ASSIGN_TASK_MUTATION = gql`
	mutation AssignTask($input: AssignTaskInput!) {
		assignTask(input: $input) {
			id
			assignedTo {
				id
				name
			}
		}
	}
`;

export default function ProjectPage() {
	const params = useParams<{ id: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = useMemo(() => getToken(), []);
	const projectId = params?.id;
	const workspaceId = searchParams?.get("workspace") ?? "";

	useEffect(() => {
		if (!token) {
			router.push("/login");
		}
	}, [router, token]);

	const { data: meData } = useQuery<MeData>(ME_QUERY, { skip: !token });
	const { data: taskData, loading, refetch } = useQuery<TasksData>(TASKS_QUERY, {
		variables: { projectId },
		skip: !token || !projectId,
	});
	const { data: workspaceData } = useQuery<WorkspaceData>(WORKSPACE_QUERY, {
		variables: { id: workspaceId },
		skip: !token || !workspaceId,
	});

	const [createTask, { loading: creating }] = useMutation(
		CREATE_TASK_MUTATION,
		{
			onCompleted: () => refetch(),
		}
	);
	const [updateStatus] = useMutation(UPDATE_STATUS_MUTATION, {
		onCompleted: () => refetch(),
	});
	const [assignTask] = useMutation(ASSIGN_TASK_MUTATION, {
		onCompleted: () => refetch(),
	});

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState("MEDIUM");
	const [assignee, setAssignee] = useState("");

	const members: WorkspaceMember[] = workspaceData?.workspace?.members ?? [];
	const currentUserId = meData?.me?.id;
	const currentMembership = members.find(
		(member) => member.user.id === currentUserId
	);
	const role = currentMembership?.role ?? "MEMBER";
	const isAdmin = role === "ADMIN" || role === "OWNER";

	const handleCreate = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!title.trim()) return;
		await createTask({
			variables: {
				input: {
					title,
					description: description || null,
					priority,
					projectId,
					assignedTo: assignee || null,
				},
			},
		});
		setTitle("");
		setDescription("");
	};

	const handleStatusChange = async (taskId: string, status: string) => {
		await updateStatus({ variables: { input: { taskId, status } } });
	};

	const handleAssign = async (taskId: string, userId: string) => {
		await assignTask({ variables: { input: { taskId, userId } } });
	};

	const projectName = taskData?.tasks?.[0]?.project?.name ?? "Project";
	const tasks: Task[] = taskData?.tasks ?? [];
	const todoTasks = tasks.filter((task) => task.status === "TODO");
	const inProgressTasks = tasks.filter(
		(task) => task.status === "IN_PROGRESS"
	);
	const doneTasks = tasks.filter((task) => task.status === "DONE");

	return (
		<div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100">
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<a
							className="text-sm text-zinc-500"
							href={`/workspaces/${workspaceId}`}
						>
							← Back to workspace
						</a>
						<h1 className="mt-2 text-3xl font-semibold text-zinc-900">
							{projectName}
						</h1>
						<p className="mt-1 text-sm text-zinc-500">Task board</p>
					</div>
					<span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-zinc-500">
						Role: {role}
					</span>
				</div>

				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Todo</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{todoTasks.length}
						</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">
							In progress
						</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{inProgressTasks.length}
						</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Done</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{doneTasks.length}
						</p>
					</div>
					<div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
						<p className="text-xs uppercase tracking-wide text-zinc-400">Members</p>
						<p className="mt-2 text-2xl font-semibold text-zinc-900">
							{members.length}
						</p>
					</div>
				</div>

				<div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
					<div className="space-y-6">
						<div className="grid gap-4 lg:grid-cols-3">
							{[
								{ key: "TODO", label: "Todo", items: todoTasks },
								{
									key: "IN_PROGRESS",
									label: "In progress",
									items: inProgressTasks,
								},
								{ key: "DONE", label: "Done", items: doneTasks },
							].map((column) => (
								<div
									key={column.key}
									className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
								>
									<div className="flex items-center justify-between">
										<h2 className="text-sm font-semibold text-zinc-900">
											{column.label}
										</h2>
										<span className="text-xs text-zinc-400">
											{column.items.length}
										</span>
									</div>
									{loading ? (
										<p className="mt-4 text-sm text-zinc-500">Loading...</p>
									) : column.items.length === 0 ? (
										<p className="mt-4 text-xs text-zinc-500">No tasks</p>
									) : (
										<div className="mt-4 space-y-3">
											{column.items.map((task) => {
												const canUpdateStatus =
													isAdmin || task.assignedTo?.id === currentUserId;
												return (
													<div
														key={task.id}
														className="rounded-xl border border-zinc-100 px-4 py-4"
													>
														<div className="flex items-start justify-between">
															<div>
																<h3 className="text-sm font-semibold text-zinc-900">
																	{task.title}
																</h3>
																{task.description && (
																	<p className="mt-1 text-xs text-zinc-500">
																		{task.description}
																	</p>
																)}
															</div>
															<span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
																{task.priority}
															</span>
														</div>
														<div className="mt-3 flex flex-wrap items-center gap-2">
															{canUpdateStatus ? (
																<select
																	className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
																	value={task.status}
																	onChange={(e) =>
																	handleStatusChange(task.id, e.target.value)
																}
																>
																	<option value="TODO">Todo</option>
																	<option value="IN_PROGRESS">In progress</option>
																	<option value="DONE">Done</option>
																</select>
															) : (
																<span className="text-[10px] uppercase text-zinc-400">
																	{task.status}
																</span>
															)}
															<span className="text-xs text-zinc-500">
																Assignee: {task.assignedTo?.name ?? "Unassigned"}
															</span>
															{isAdmin && (
																<select
																	className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
																	value={task.assignedTo?.id ?? ""}
																	onChange={(e) =>
																	handleAssign(task.id, e.target.value)
																}
																>
																	<option value="">Assign...</option>
																	{members.map((member) => (
																		<option
																			key={member.user.id}
																			value={member.user.id}
																		>
																			{member.user.name}
																		</option>
																	))}
																</select>
															)}
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-zinc-900">New task</h2>
						<p className="mt-2 text-sm text-zinc-500">
							Add details and assign the next action.
						</p>
						<form className="mt-4 space-y-3" onSubmit={handleCreate}>
							<input
								className="w-full rounded-xl border border-zinc-200 px-3 py-2"
								placeholder="Task title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								required
							/>
							<textarea
								className="w-full rounded-xl border border-zinc-200 px-3 py-2"
								placeholder="Description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
							<select
								className="w-full rounded-xl border border-zinc-200 px-3 py-2"
								value={priority}
								onChange={(e) => setPriority(e.target.value)}
							>
								<option value="LOW">Low</option>
								<option value="MEDIUM">Medium</option>
								<option value="HIGH">High</option>
							</select>
							{isAdmin && (
								<select
									className="w-full rounded-xl border border-zinc-200 px-3 py-2"
									value={assignee}
									onChange={(e) => setAssignee(e.target.value)}
								>
									<option value="">Assign to...</option>
									{members.map((member) => (
										<option key={member.user.id} value={member.user.id}>
											{member.user.name}
										</option>
									))}
								</select>
							)}
							<button
								type="submit"
								disabled={creating}
								className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
							>
								{creating ? "Creating..." : "Create task"}
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
		email: string;
	};
};

type Task = {
	id: string;
	title: string;
	description?: string | null;
	status: string;
	priority: string;
	assignedTo?: {
		id: string;
		name: string;
	} | null;
	project?: {
		id: string;
		name: string;
	};
};

type TasksData = {
	tasks: Task[];
};

type WorkspaceData = {
	workspace: {
		id: string;
		name: string;
		members: WorkspaceMember[];
	};
};

type MeData = {
	me: {
		id: string;
		name: string;
	};
};
