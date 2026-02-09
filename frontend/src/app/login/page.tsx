"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setToken } from "../../lib/auth";

const LOGIN_MUTATION = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			token
			user {
				id
				name
				email
			}
		}
	}
`;

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [login, { loading }] = useMutation<LoginData>(LOGIN_MUTATION);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		try {
			const { data } = await login({
				variables: { input: { email, password } },
			});
			if (data?.login?.token) {
				setToken(data.login.token);
				router.push("/dashboard");
			}
		} catch {
			setError("Invalid credentials");
		}
	};

	return (
		<div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
			<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
				<h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
				<p className="mt-2 text-sm text-zinc-500">
					Welcome back to Task-Collab.
				</p>
				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="text-sm font-medium text-zinc-700">Email</label>
						<input
							type="email"
							className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div>
						<label className="text-sm font-medium text-zinc-700">Password</label>
						<input
							type="password"
							className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					{error && (
						<p className="text-sm text-red-600">{error}</p>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
				<p className="mt-6 text-sm text-zinc-500">
					Don&apos;t have an account?{" "}
					<a className="text-zinc-900 font-semibold" href="/register">
						Create one
					</a>
				</p>
			</div>
		</div>
	);
}

type LoginData = {
	login: {
		token: string;
		user: {
			id: string;
			name: string;
			email: string;
		};
	};
};
