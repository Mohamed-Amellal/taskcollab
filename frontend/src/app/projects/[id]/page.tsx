"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../lib/auth";
import { ChevronRight, Loader2 } from "lucide-react";
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

	// Helper to get priority color
	const getPriorityVariant = (p: string) => {
		switch (p) {
			case "HIGH": return "danger";
			case "MEDIUM": return "warning";
			case "LOW": return "success";
			default: return "secondary";
		}
	};

	const columns = [
		{ key: "TODO", label: "To Do", items: tasks.filter((t) => t.status === "TODO") },
		{ key: "IN_PROGRESS", label: "In Progress", items: tasks.filter((t) => t.status === "IN_PROGRESS") },
		{ key: "DONE", label: "Done", items: tasks.filter((t) => t.status === "DONE") },
	];

	return (
		<div className="min-h-screen bg-zinc-50/50">
			<div className="mx-auto max-w-[1400px] px-6 py-10">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
					<div>
						<div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
							<a href={`/workspaces/${workspaceId}`} className="hover:text-zinc-900 transition-colors">
								Workspace
							</a>
							<ChevronRight className="h-4 w-4" />
							<span>Project</span>
						</div>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold tracking-tight text-zinc-900">
								{projectName}
							</h1>
							<Badge variant="outline">{role}</Badge>
						</div>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
					{/* Kanban Board */}
					<div className="grid gap-6 md:grid-cols-3 items-start overflow-x-auto pb-4">
						{columns.map((column) => (
							<div key={column.key} className="flex flex-col gap-4 min-w-[280px]">
								<div className="flex items-center justify-between px-1">
									<h2 className="font-semibold text-zinc-700 flex items-center gap-2">
										{column.label}
										<span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs">
											{column.items.length}
										</span>
									</h2>
								</div>

								<div className="space-y-3">
									{loading ? (
										<Card className="p-4 flex justify-center">
											<Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
										</Card>
									) : column.items.length === 0 ? (
										<div className="border-2 border-dashed border-zinc-100 rounded-xl p-8 text-center text-zinc-400 text-sm">
											No tasks
										</div>
									) : (
										column.items.map((task) => {
											const canUpdateStatus = isAdmin || task.assignedTo?.id === currentUserId;
											return (
												<Card key={task.id} className="p-4 hover:shadow-md transition-shadow group">
													<div className="space-y-3">
														<div className="flex items-start justify-between gap-2">
															<h3 className="font-medium text-zinc-900 text-sm leading-snug">
																{task.title}
															</h3>
															<Badge variant={getPriorityVariant(task.priority) as any} className="shrink-0 text-[10px] px-1.5 py-0 h-5">
																{task.priority}
															</Badge>
														</div>

														{task.description && (
															<p className="text-xs text-zinc-500 line-clamp-2">
																{task.description}
															</p>
														)}

														<div className="pt-2 border-t border-zinc-50 flex items-center justify-between gap-2">
															{/* Assignee */}
															<div className="flex items-center gap-2 min-w-0">
																{task.assignedTo ? (
																	<div className="flex items-center gap-1.5" title={task.assignedTo.name}>
																		<div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
																			{task.assignedTo.name.charAt(0)}
																		</div>
																		<span className="text-xs text-zinc-600 truncate max-w-[80px]">
																			{task.assignedTo.name}
																		</span>
																	</div>
																) : (
																	<span className="text-xs text-zinc-400 italic">Unassigned</span>
																)}
															</div>

															{/* Actions (only visible on hover/focus if appropriate usually, but keep simple) */}
															<div className="opacity-100 transition-opacity flex gap-1">
																{isAdmin && (
																	<select
																		className="w-4 h-4 opacity-0 absolute"
																		onChange={(e) => handleAssign(task.id, e.target.value)}
																		value={task.assignedTo?.id ?? ""}
																	>
																		<option value="">Assign...</option>
																		{members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
																	</select>
																)}
															</div>
														</div>

														{/* Controls row */}
														<div className="grid grid-cols-2 gap-2 mt-2">
															{canUpdateStatus && (
																<select
																	className="col-span-2 text-xs border rounded px-1 py-1 bg-zinc-50 border-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
																	value={task.status}
																	onChange={(e) => handleStatusChange(task.id, e.target.value)}
																>
																	<option value="TODO">To Do</option>
																	<option value="IN_PROGRESS">In Progress</option>
																	<option value="DONE">Done</option>
																</select>
															)}
															{isAdmin && (
																<select
																	className="col-span-2 text-xs border rounded px-1 py-1 bg-zinc-50 border-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
																	value={task.assignedTo?.id ?? ""}
																	onChange={(e) => handleAssign(task.id, e.target.value)}
																>
																	<option value="">Assign...</option>
																	{members.map((member) => (
																		<option key={member.user.id} value={member.user.id}>
																			{member.user.name}
																		</option>
																	))}
																</select>
															)}
														</div>
													</div>
												</Card>
											);
										})
									)}
								</div>
							</div>
						))}
					</div>

					{/* Sidebar - Create Task */}
					<div className="space-y-6">
						{isAdmin && (
							<Card className="sticky top-6">
								<CardHeader>
									<CardTitle>Add Task</CardTitle>
									<CardDescription>
										Create a new task for this project.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form onSubmit={handleCreate} className="space-y-4">
										<Input
											placeholder="Task title"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											required
										/>
										<textarea
											className="flex min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
											placeholder="Description (optional)"
											value={description}
											onChange={(e) => setDescription(e.target.value)}
										/>
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-2">
												<label className="text-xs font-medium text-zinc-700">Priority</label>
												<select
													className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
													value={priority}
													onChange={(e) => setPriority(e.target.value)}
												>
													<option value="LOW">Low</option>
													<option value="MEDIUM">Medium</option>
													<option value="HIGH">High</option>
												</select>
											</div>
											{isAdmin && (
												<div className="space-y-2">
													<label className="text-xs font-medium text-zinc-700">Assignee</label>
													<select
														className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
														value={assignee}
														onChange={(e) => setAssignee(e.target.value)}
													>
														<option value="">Unassigned</option>
														{members.map((member) => (
															<option key={member.user.id} value={member.user.id}>
																{member.user.name}
															</option>
														))}
													</select>
												</div>
											)}
										</div>
										<Button
											type="submit"
											className="w-full"
											isLoading={creating}
										>
											Create Task
										</Button>
									</form>
								</CardContent>
							</Card>
						)}

						{/* Stats/Info Card */}
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">Project Stats</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-zinc-500">Total Tasks</span>
										<span className="font-medium">{tasks.length}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-zinc-500">Completed</span>
										<span className="font-medium">{tasks.filter(t => t.status === 'DONE').length}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-zinc-500">Members</span>
										<span className="font-medium">{members.length}</span>
									</div>
								</div>
							</CardContent>
						</Card>
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
