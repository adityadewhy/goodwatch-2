"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function LoginPage() {
	const [error, setError] = useState("");
	const [form, setForm] = useState({username: "", password: ""});
	const [loading, setLoading] = useState(false);

	const router = useRouter();

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify(form),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Invalid username/password");
				return;
			}

			router.push("/home");
		} catch (err) {
			setError("network error, try later");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* left panel */}
			<div className="hidden lg:flex flex-col justify-between flex-1 bg-gw-surface border-r border-gw-gold/15 p-12">
				<a href="/" className="font-playfair text-2xl text-gw-gold">
					Good<span className="text-gw-white italic">Watch</span>
				</a>

				<div className="opacity-0 animate-fade-up">
					<div className="flex items-center gap-3">
						<div className="w-7 h-px bg-gw-gold-dim" />
						<div className="text-gw-gold-dim text-xs tracking-widest">
							WELCOME BACK
						</div>
					</div>

					<div className="font-playfair text-4xl font-bold text-gw-white mt-3">
						Your taste is{" "}
						<span className="text-gw-gold italic">
							worth <br />
							sharing
						</span>
					</div>

					<p className="text-gw-muted text-sm mt-6 max-w-80 leading-relaxed">
						Every rating you give builds a picture of who you are as a viewer.
						Sign back in and pick up where you left off.
					</p>
				</div>

				<div className="flex flex-row ">
					<div className="border-l-4 border-gw-gold-dim">
						<div className="flex flex-col pl-8 pt-1 pb-1">
							<div className="font-playfair italic text-gw-muted text-sm mb-2">
								"Cinema is a mirror by which we often see ourselves."
							</div>
							<div className="text-gw-gold-dim text-xs tracking-widest uppercase">
								Martin Scorsese
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* right panel */}
			<div className="w-full lg:max-w-lg flex flex-col justify-center p-12">
				<a href="/" className="lg:hidden font-playfair text-2xl text-gw-gold">
					Good<span className="text-gw-white italic">Watch</span>
				</a>

				<div className="flex flex-col mb-10 opacity-0 animate-fade-up">
					<h1 className="font-playfair text-4xl font-bold text-gw-white mb-3">
						Sign in
					</h1>

					<p className="text-gw-muted">
						Don't have and account?{" "}
						<a
							href="/signup"
							className="text-gw-gold border-b border-gw-gold-dim pb-px"
						>
							{" "}
							Create one
						</a>
					</p>
				</div>

				{error && (
					<div className="bg-gw-error/10 border-l-4 border-gw-error text-gw-error p-3 text-sm mb-4">
						{error}
					</div>
				)}

				<form
					onSubmit={handleSubmit}
					style={{animationDelay: "150ms"}}
					className="flex flex-col gap-5 opacity-0 animate-fade-up"
				>
					<div>
						<label className="text-gw-muted text-xs tracking-widest mb-2">
							USERNAME
						</label>

						<input
							type="text"
							placeholder="your0username"
							required
							minLength={3}
							maxLength={20}
							value={form.username}
							onChange={(e) => setForm({...form, username: e.target.value})}
							className="w-full border border-gw-gold/15 bg-gw-surface2 text-gw-white p-3 outline-none rounded-sm transition-all focus:border-gw-gold hover:border-gw-gold/40"
						/>
					</div>

					<div>
						<label className="text-gw-muted text-xs tracking-widest mb-2">
							PASSWORD
						</label>

						<input
							type="password"
							placeholder="••••••••"
							required
							minLength={8}
							maxLength={72}
							value={form.password}
							onChange={(e) => setForm({...form, password: e.target.value})}
							className="w-full border border-gw-gold/15 bg-gw-surface2 text-gw-white p-3 outline-none rounded-sm transition-all focus:border-gw-gold hover:border-gw-gold/40 "
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-gw-gold text-gw-black font-medium tracking-widest uppercase text-sm p-3.5 rounded-sm transition-all hover:bg-[#e8c97a] hover:-translate-y-px active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div
					className="border-t border-gw-gold/15 mt-12 p-6 flex justify-between opacity-0 animate-fade-up"
					style={{animationDelay: "300ms"}}
				>
					{[
						{
							label: "GitHub",
							href: "https://github.com/adityadewhy/goodwatch-2/tree/main",
						},
						{label: "@adityadewhy", href: "https://twitter.com/adityadewhy"},
						{label: "LinkedIn", href: "https://linkedin.com/in/adityadewhy"},
					].map((link) => (
						<a
							key={link.label}
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-gw-muted tracking-widest hover:text-gw-gold transition-colors"
						>
							{link.label}
						</a>
					))}
				</div>
			</div>
		</div>
	);
}
