"use client";

import {Turnstile} from "@marsidev/react-turnstile";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function SignupPage() {
	const [form, setForm] = useState({username: "", password: "", confirm: ""});
	const [captchaToken, setCaptchaToken] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const router = useRouter();

	const getPasswordStrength = (p: string) => {
		if (p.length === 0) return {score: 0, label: "", color: "transparent"};
		if (p.length < 6) return {score: 1, label: "Too short", color: "#c0574a"}; // gw-error
		if (p.length < 8) return {score: 2, label: "Weak", color: "#c0574a"};

		const hasUpper = /[A-Z]/.test(p);
		const hasNum = /[0-9]/.test(p);
		const hasSpecial = /[^a-zA-Z0-9]/.test(p);
		const extras = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;

		if (extras === 0) return {score: 3, label: "Fair", color: "#c9a84c"}; // gw-gold
		if (extras === 1) return {score: 4, label: "Good", color: "#8aaa5c"}; // light green
		return {score: 5, label: "Strong", color: "#5aaa7a"}; // solid green
	};

	const strength = getPasswordStrength(form.password);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();

		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					username: form.username,
					password: form.password,
					captchaToken: captchaToken,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Something went wrong");
				return;
			}

			router.push("/home");
			console.log("Account created successfully");
		} catch (e) {
			setError("error, try again later");
		} finally {
			setLoading(false);
		}
	};

	return (
		// MAIN CONTAINER: Takes up the full screen height and uses flexbox to put items side-by-side
		<div className="min-h-screen flex">
			{/* left panel */}

			<div className="hidden lg:flex flex-col justify-between flex-1 bg-gw-surface border-r border-gw-gold/15 p-12">
				{/* logo */}
				<a href="/" className="font-playfair text-2xl text-gw-gold">
					Good<span className="text-gw-white italic">Watch</span>
				</a>

				<div className="opacity-0 animate-fade-up">
					<div className="flex items-center gap-3">
						<div className="w-7 h-px bg-gw-gold-dim" />
						<div className="text-gw-gold-dim text-xs tracking-widest">
							JOIN GOODWATCH
						</div>
					</div>

					<div className="font-playfair text-4xl font-bold text-gw-white mt-3">
						Start your <span className="text-gw-gold italic">film history</span>{" "}
						<br />
						today
					</div>

					<p className="text-gw-muted text-sm mt-6 max-w-80 leading-relaxed">
						One account. Your watchlist, your ratings, your circle. Everything
						private by default — visible only to the people you trust.
					</p>

					<div className="mt-8 flex flex-col gap-3">
						{[
							"Rate and track every movie you watch",
							"Follow friends and see their take",
							"Private by default, no algorithmic feed",
						].map((item, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="w-4 h-4 mt-0.5 border border-gw-gold-dim flex justify-center items-center shrink-0">
									<div className="w-1 h-1 bg-gw-gold" />
								</div>{" "}
								<span className="text-sm text-gw-muted">{item}</span>
							</div>
						))}
					</div>
				</div>

				{/* bottom */}
				<div className="border-t border-gw-gold/15 pt-6">
					<p className="text-gw-gold-dim text-xs tracking-widest">
						Free forever · No email required · Open source
					</p>
				</div>
			</div>

			{/* right panel */}

			<div className="w-full lg:max-w-lg flex flex-col justify-center p-12">
				<a href="/" className="lg:hidden font-playfair text-2xl text-gw-gold">
					Good<span className="text-gw-white italic">Watch</span>
				</a>

				<div className="flex flex-col mb-10 opacity-0 animate-fade-up">
					<h1 className="font-playfair text-4xl font-bold text-gw-white mb-3">
						Create account
					</h1>
					<p className="text-gw-muted">
						Already have one?{" "}
						<a
							href="/"
							className="text-gw-gold border-b border-gw-gold-dim pb-px"
						>
							Sign in
						</a>
					</p>
				</div>

				{error && (
					<div className="bg-gw-error/10 border-l-4 border-gw-error text-gw-error p-3 text-sm mb-4">
						{error}
					</div>
				)}

				{/* form */}
				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-5 opacity-0 animate-fade-up"
					style={{animationDelay: "150ms"}}
				>
					{/* username */}
					<div>
						<label className="text-gw-muted text-xs tracking-widest mb-2">
							USERNAME
						</label>

						<input
							type="text"
							placeholder="choose_a_username"
							required
							minLength={3}
							maxLength={20}
							value={form.username}
							onChange={(e) => setForm({...form, username: e.target.value})}
							className="w-full border border-gw-gold/15 bg-gw-surface2 text-gw-white p-3 outline-none rounded-sm transition-all focus:border-gw-gold hover:border-gw-gold/40"
						/>
						<p className="text-gw-muted text-xs mt-2">
							3–20 characters. Alphanumerics only.
						</p>
					</div>

					{/* password */}
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

						{/* strength meter */}
						{form.password.length > 0 && (
							<div className="mt-2">
								<div className="flex gap-1">
									{[1, 2, 3, 4, 5].map((i) => (
										<div
											key={i}
											className="h-1 flex-1 rounded-sm transition-colors duration-300 border border-gw-gold/15"
											style={{
												backgroundColor:
													i <= strength.score ? strength.color : "transparent",
											}}
										/>
									))}
								</div>

								<span
									className="text-xs tracking-widest"
									style={{color: strength.color}}
								>
									{strength.label}
								</span>
							</div>
						)}
					</div>

					{/* repeat password */}
					<div>
						<label className="text-gw-muted text-xs tracking-widest mb-2">
							CONFIRM PASSWORD
						</label>
						<input
							type="password"
							placeholder="••••••••"
							required
							value={form.confirm}
							onChange={(e) => setForm({...form, confirm: e.target.value})}
							className={`w-full bg-gw-surface2 text-gw-white p-3 outline-none rounded-sm transition-all border 
								${
									form.confirm.length > 0
										? form.confirm === form.password
											? "border-[#5aaa7a]/50 focus:border-[#5aaa7a] focus:bg-[#1e1c18]" //if matching
											: "border-gw-error/50 focus:border-gw-error focus:bg-[#1e1c18]" //if not matching
										: "border-gw-gold/15 focus:border-gw-gold hover:not(:focus):border-gw-gold/40" //default
								}`}
						/>

						{form.confirm.length > 0 && form.confirm !== form.password && (
							<p className="text-gw-error text-xs mt-2 ">
								Passwords do not match
							</p>
						)}
					</div>

					{/* because the turnstile loads later, we have to reserve 65px worth of space for it so that it doesnt cause issues for other components' animations */}
					<div className="mt-2 min-h-16.25">
						<Turnstile
							siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
							onSuccess={(token) => setCaptchaToken(token)}
						/>
					</div>

					<button
						type="submit"
						disabled={
							loading || form.password !== form.confirm || !captchaToken
						}
						className="w-full bg-gw-gold text-gw-black font-medium tracking-widest uppercase text-sm p-3.5 rounded-sm transition-all hover:bg-[#e8c97a] hover:-translate-y-px active:translate-y-0 cursor-pointer disabled:opacity-50  disabled:cursor-wait"
					>
						{loading ? "Creating account..." : "Create account"}
					</button>
					<p className="text-gw-muted text-xs text-center tracking-widest">
						Dev is not liable for anything. Create account at your own risk.
					</p>
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
