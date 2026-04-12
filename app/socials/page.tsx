"use client";

import Topbar from "@/components/Topbar";

import {useEffect, useState} from "react";
import Link from "next/link";

type FollowUser = {
	username: string;
	followedAt?: string;
	followingSince?: string;
};
type IncomingReq = {
	followId: string;
	fromUsername: string;
	requestedAt: string;
};
type OutgoingReq = {followId: string; toUsername: string; requestedAt: string};

export default function SocialsPage() {
	const [activeTab, setActiveTab] = useState<
		"following" | "followers" | "requests"
	>("following");
	const [requestSubTab, setRequestSubTab] = useState<"incoming" | "outgoing">(
		"incoming",
	);

	const [myUsername, setMyUsername] = useState<string | null>(null);

	const [following, setFollowing] = useState<FollowUser[]>([]);
	const [followers, setFollowers] = useState<FollowUser[]>([]);
	const [incomingReqs, setIncomingReqs] = useState<IncomingReq[]>([]);
	const [outgoingReqs, setOutgoingReqs] = useState<OutgoingReq[]>([]);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/auth/me")
			.then((res) => res.json())
			.then((data) => {
				if (data?.username) setMyUsername(data.username);
			})
			.catch(console.error);
	}, []);

	useEffect(() => {
		if (!myUsername) return;

		async function fetchTabData() {
			setLoading(true);
			try {
				if (activeTab === "following") {
					const res = await fetch(`/api/users/${myUsername}/following`);
					const data = await res.json();
					if (res.ok) setFollowing(data.following || []);
				} else if (activeTab === "followers") {
					const res = await fetch(`/api/users/${myUsername}/followers`);
					const data = await res.json();
					if (res.ok) setFollowers(data.followers || []);
				} else if (activeTab === "requests") {
					if (requestSubTab === "incoming") {
						const res = await fetch(`/api/users/${myUsername}/follow-requests`);
						const data = await res.json();
						if (res.ok) setIncomingReqs(data.requests || []);
					} else {
						const res = await fetch(
							`/api/users/${myUsername}/outgoing-requests`,
						);
						const data = await res.json();
						if (res.ok) setOutgoingReqs(data.requests || []);
					}
				}
			} catch (error) {
				console.error("Failed to fetch tab data:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchTabData();
	}, [myUsername, activeTab, requestSubTab]);

	const handleUnfollow = async (targetUsername: string) => {
		// optimistic update
		setFollowing((prev) => prev.filter((u) => u.username !== targetUsername));
		try {
			await fetch(`/api/users/${targetUsername}/follow`, {method: "DELETE"});
		} catch (error) {
			console.error("Failed to unfollow", error);
		}
	};

	const handleRemoveFollower = async (followerUsername: string) => {
		setFollowers((prev) => prev.filter((u) => u.username !== followerUsername));
		try {
			await fetch(`/api/users/${followerUsername}/followers`, {
				method: "DELETE",
			});
		} catch (error) {
			console.error("Failed to remove follower", error);
		}
	};

	const handleIncomingReq = async (
		followId: string,
		action: "accept" | "decline",
	) => {
		setIncomingReqs((prev) => prev.filter((req) => req.followId !== followId));
		try {
			await fetch(`/api/users/${myUsername}/follow-requests`, {
				method: "PATCH",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({followId, action}),
			});
		} catch (error) {
			console.error(`Failed to ${action} request`, error);
		}
	};

	const handleCancelOutgoing = async (toUsername: string) => {
		setOutgoingReqs((prev) =>
			prev.filter((req) => req.toUsername !== toUsername),
		);
		try {
			// deleting a follow request=unfollow
			await fetch(`/api/users/${toUsername}/follow`, {method: "DELETE"});
		} catch (error) {
			console.error("Failed to cancel request", error);
		}
	};

	return (
		<div className="min-h-screen pt-14 bg-gw-black text-gw-white font-sans pb-20">
			<Topbar />

			<div className="max-w-2xl px-6 pt-10 mx-auto">
				<h1 className="flex justify-center text-2xl md:text-3xl font-bold font-playfair mb-8 text-gw-white tracking-widest ">
					Socials
				</h1>

				{/* main tabs */}
				<div className="flex justify-evenly gap-6 border-b border-gw-gold/10 mb-6">
					<button
						onClick={() => setActiveTab("following")}
						className={`pb-2 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 hover:cursor-pointer ${
							activeTab === "following"
								? "text-gw-gold border-gw-gold"
								: "text-gw-muted border-transparent hover:text-gw-white"
						}`}
					>
						Following
					</button>

					<button
						onClick={() => setActiveTab("followers")}
						className={`pb-2 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 hover:cursor-pointer ${
							activeTab === "followers"
								? "text-gw-gold border-gw-gold"
								: "text-gw-muted border-transparent hover:text-gw-white"
						}`}
					>
						Followers
					</button>

					<button
						onClick={() => setActiveTab("requests")}
						className={`pb-2 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 hover:cursor-pointer  ${
							activeTab === "requests"
								? "text-gw-gold border-gw-gold"
								: "text-gw-muted border-transparent hover:text-gw-white"
						}`}
					>
						Requests
					</button>
				</div>

				{activeTab === "requests" && (
					<div className="flex gap-4 mb-6 animate-fade-in justify-center">
						<button
							onClick={() => setRequestSubTab("incoming")}
							className={`px-3 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors ${
								requestSubTab === "incoming"
									? "bg-gw-surface2 text-gw-gold border border-gw-gold/20"
									: "bg-transparent text-gw-muted border border-gw-gold/10 hover:text-gw-white"
							}`}
						>
							Incoming
						</button>
						<button
							onClick={() => setRequestSubTab("outgoing")}
							className={`px-3 py-1.5 text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors ${
								requestSubTab === "outgoing"
									? "bg-gw-surface2 text-gw-gold border border-gw-gold/20"
									: "bg-transparent text-gw-muted border border-gw-gold/10 hover:text-gw-white"
							}`}
						>
							Outgoing
						</button>
					</div>
				)}

				{/* Temporary Data Proof */}
				<div className="text-sm text-gw-muted border border-dashed border-gw-gold/20 rounded-sm p-8 text-center bg-gw-surface2/30">
					{loading ? (
						<div className="flex justify-center">
							<div className="w-5 h-5 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
						</div>
					) : (
						<>
							{activeTab === "following" && (
								<p>You are following {following.length} people.</p>
							)}
							{activeTab === "followers" && (
								<p>You have {followers.length} followers.</p>
							)}
							{activeTab === "requests" && requestSubTab === "incoming" && (
								<p>You have {incomingReqs.length} incoming requests.</p>
							)}
							{activeTab === "requests" && requestSubTab === "outgoing" && (
								<p>You have {outgoingReqs.length} pending outgoing requests.</p>
							)}
						</>
					)}
				</div>

				{/* --- LIST CONTENT --- */}
				<div className="mt-6">
					{loading ? (
						<div className="flex justify-center py-10">
							<div className="w-6 h-6 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
						</div>
					) : (
						<div className="flex flex-col">
							{/* 1. FOLLOWING LIST */}
							{activeTab === "following" &&
								(following.length === 0 ? (
									<div className="text-center py-10 text-sm text-gw-muted italic">
										You are not following anyone yet.
									</div>
								) : (
									following.map((user) => (
										<div
											key={user.username}
											className="flex items-center justify-between py-4 border-b border-gw-gold/5"
										>
											<Link
												href={`/profile/${user.username}`}
												className="flex items-center gap-4 hover:opacity-80 transition-opacity"
											>
												<div className="w-10 h-10 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-sm text-gw-gold font-medium">
													{user.username.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-sm font-medium text-gw-white">
														{user.username}
													</div>
													<div className="text-[10px] text-gw-muted">
														Following since{" "}
														{new Date(user.followedAt!).toLocaleDateString()}
													</div>
												</div>
											</Link>
											<button
												onClick={() => handleUnfollow(user.username)}
												className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold text-gw-muted border border-gw-gold/20 rounded-sm hover:text-gw-white hover:border-gw-gold/50 transition-colors"
											>
												Unfollow
											</button>
										</div>
									))
								))}

							{/* 2. FOLLOWERS LIST */}
							{activeTab === "followers" &&
								(followers.length === 0 ? (
									<div className="text-center py-10 text-sm text-gw-muted italic">
										You don't have any followers yet.
									</div>
								) : (
									followers.map((user) => (
										<div
											key={user.username}
											className="flex items-center justify-between py-4 border-b border-gw-gold/5"
										>
											<Link
												href={`/profile/${user.username}`}
												className="flex items-center gap-4 hover:opacity-80 transition-opacity"
											>
												<div className="w-10 h-10 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-sm text-gw-gold font-medium">
													{user.username.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-sm font-medium text-gw-white">
														{user.username}
													</div>
													<div className="text-[10px] text-gw-muted">
														Follower since{" "}
														{new Date(
															user.followingSince!,
														).toLocaleDateString()}
													</div>
												</div>
											</Link>
											<button
												onClick={() => handleRemoveFollower(user.username)}
												className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold text-gw-error/80 border border-gw-error/30 rounded-sm hover:text-gw-error hover:border-gw-error transition-colors"
											>
												Remove
											</button>
										</div>
									))
								))}

							{/* 3. INCOMING REQUESTS */}
							{activeTab === "requests" &&
								requestSubTab === "incoming" &&
								(incomingReqs.length === 0 ? (
									<div className="text-center py-10 text-sm text-gw-muted italic">
										No pending incoming requests.
									</div>
								) : (
									incomingReqs.map((req) => (
										<div
											key={req.followId}
											className="flex items-center justify-between py-4 border-b border-gw-gold/5"
										>
											<Link
												href={`/profile/${req.fromUsername}`}
												className="flex items-center gap-4 hover:opacity-80 transition-opacity"
											>
												<div className="w-10 h-10 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-sm text-gw-gold font-medium">
													{req.fromUsername.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-sm font-medium text-gw-white">
														{req.fromUsername}
													</div>
													<div className="text-[10px] text-gw-muted">
														Requested{" "}
														{new Date(req.requestedAt).toLocaleDateString()}
													</div>
												</div>
											</Link>
											<div className="flex gap-2">
												<button
													onClick={() =>
														handleIncomingReq(req.followId, "decline")
													}
													className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold text-gw-muted border border-gw-gold/20 rounded-sm hover:text-gw-white transition-colors"
												>
													Decline
												</button>
												<button
													onClick={() =>
														handleIncomingReq(req.followId, "accept")
													}
													className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold bg-gw-gold text-gw-black rounded-sm hover:bg-[#e8c97a] transition-colors"
												>
													Accept
												</button>
											</div>
										</div>
									))
								))}

							{/* 4. OUTGOING REQUESTS */}
							{activeTab === "requests" &&
								requestSubTab === "outgoing" &&
								(outgoingReqs.length === 0 ? (
									<div className="text-center py-10 text-sm text-gw-muted italic">
										No pending outgoing requests.
									</div>
								) : (
									outgoingReqs.map((req) => (
										<div
											key={req.followId}
											className="flex items-center justify-between py-4 border-b border-gw-gold/5"
										>
											<Link
												href={`/profile/${req.toUsername}`}
												className="flex items-center gap-4 hover:opacity-80 transition-opacity"
											>
												<div className="w-10 h-10 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-sm text-gw-gold font-medium">
													{req.toUsername.slice(0, 2).toUpperCase()}
												</div>
												<div>
													<div className="text-sm font-medium text-gw-white">
														{req.toUsername}
													</div>
													<div className="text-[10px]  text-gw-gold-dim italic">
														Awaiting approval...
													</div>
												</div>
											</Link>
											<button
												onClick={() => handleCancelOutgoing(req.toUsername)}
												className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold text-gw-muted border border-gw-gold/20 rounded-sm hover:text-gw-white hover:border-gw-gold/50 transition-colors"
											>
												Cancel Request
											</button>
										</div>
									))
								))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
