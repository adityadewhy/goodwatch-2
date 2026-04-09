"use client";

import Topbar from "@/components/Topbar";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {Star} from "lucide-react";

type ProfileData = {
	user: {
		id: string;
		username: string;
		createdAt: string;
		_count: {
			ratings: number;
			comments: number;
			following: number;
			followers: number;
		};
		ratings: {
			score: number;
			movie: {tmdbId: number; title: string; posterPath: string | null};
		}[];
		watchlist: {
			movie: {tmdbId: number; title: string; posterPath: string | null};
		}[];
		comments: {
			content: string;
			createdAt: string;
			movie: {tmdbId: number; title: string; posterPath: string | null};
		}[];
	};
	coverMovie: {
		title: string;
		posterPath: string;
		backdrop_path: string | null;
	} | null;
	profileMovie: {title: string; posterPath: string} | null;
	followStatus: "PENDING" | "ACCEPTED" | null;
	isOwnProfile: boolean;
	canViewDetails: boolean;
};

export default function ProfilePage() {
	const params = useParams();
	const username = params.username as string;

	const [profileData, setProfileData] = useState<ProfileData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!username) return;
		async function fetchProfile() {
			try {
				const res = await fetch(`/api/users/${username}`);
				if (res.ok) {
					const data = await res.json();
					setProfileData(data);
				}
			} catch (error) {
				console.error("Failed to fetch profile", error);
			} finally {
				setLoading(false);
			}
		}
		fetchProfile();
	}, [username]);

	const toggleFollow = async () => {
		if (!profileData) return;

		const currentStatus = profileData.followStatus;

		// Optimistic UI: If null -> PENDING. If PENDING/ACCEPTED -> null (Unfollow/Cancel)
		const newStatus = currentStatus ? null : "PENDING";
		setProfileData({...profileData, followStatus: newStatus});

		try {
			const res = await fetch(`/api/users/${username}/follow`, {
				method: currentStatus ? "DELETE" : "POST",
			});
			if (!res.ok)
				setProfileData({...profileData, followStatus: currentStatus});
		} catch (error) {
			console.error("Failed to toggle follow", error);
			setProfileData({...profileData, followStatus: currentStatus});
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen pt-14 bg-gw-black flex items-center justify-center">
				<Topbar />
				<div className="w-6 h-6 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
			</div>
		);
	}

	if (!profileData) {
		return (
			<div className="min-h-screen pt-14 bg-gw-black flex items-center justify-center text-gw-muted">
				<Topbar />
				User not found.
			</div>
		);
	}

	const {
		user,
		coverMovie,
		profileMovie,
		followStatus,
		isOwnProfile,
		canViewDetails,
	} = profileData;

	const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	return (
		<div className="min-h-screen pt-14 bg-gw-black text-gw-white font-sans pb-20">
			<Topbar />

			{/* header */}
			<div className="relative border-b border-gw-gold/10 pb-8 bg-linear-to-b from-[#111] to-gw-black">
				<div className="h-44 md:h-56 w-full relative overflow-hidden flex items-center justify-center bg-[#151410]">
					{coverMovie?.backdrop_path ? (
						<Image
							src={coverMovie.backdrop_path}
							alt="Cover"
							fill
							// Removed blur/scale so the widescreen image looks native
							className="object-cover opacity-80"
						/>
					) : (
						<span className="text-gw-gold/30 text-xs tracking-widest uppercase z-10">
							No All-Time Favorite Set
						</span>
					)}
					<div className="absolute inset-0 bg-linear-to-b from-transparent via-gw-black/40 to-gw-black" />
				</div>

				<div className="max-w-4xl mx-auto px-6 flex gap-6 relative -mt-16 z-10">
					{/* currently watching */}
					<div className="w-24 h-36 md:w-32 md:h-48 bg-gw-surface2 border-2 border-gw-black rounded-sm shadow-2xl shrink-0 flex flex-col items-center justify-center relative overflow-hidden">
						{profileMovie?.posterPath ? (
							<Image
								src={profileMovie.posterPath}
								alt="Avatar"
								fill
								className="object-cover"
								sizes="(max-width: 768px) 96px, 128px"
							/>
						) : (
							<span className="text-[9px] text-gw-muted uppercase tracking-widest text-center mt-2">
								Currently
								<br />
								Watching
							</span>
						)}
					</div>

					{/* user info */}
					<div className="flex-1 pt-18 flex flex-col">
						<div className="flex items-center justify-between mb-1">
							<h1 className="text-2xl md:text-3xl font-bold font-playfair">
								{user.username}
							</h1>

							{/* follow-btn */}
							{!isOwnProfile && (
								<button
									onClick={toggleFollow}
									className={`px-4 py-1.5 text-[10px] md:text-xs font-semibold tracking-widest uppercase rounded-sm transition-colors ${
										followStatus === "ACCEPTED" || followStatus === "PENDING"
											? "bg-transparent text-gw-muted border border-gw-gold/20 hover:border-gw-error hover:text-gw-error"
											: "bg-gw-gold text-gw-black hover:bg-[#e8c97a]"
									}`}
								>
									{followStatus === "ACCEPTED"
										? "Unfollow"
										: followStatus === "PENDING"
											? "Requested"
											: "Follow"}
								</button>
							)}
						</div>

						<div className="text-xs text-gw-muted mb-4">
							Member since {memberSince}
						</div>

						{/* stats */}
						<div className="flex gap-6 md:gap-8 mt-auto">
							<div className="flex flex-col gap-1">
								<span className="text-lg md:text-xl text-gw-gold font-bold leading-none">
									{user._count.ratings}
								</span>
								<span className="text-[9px] text-gw-muted uppercase tracking-widest">
									Ratings
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-lg md:text-xl text-gw-gold font-bold leading-none">
									{user._count.comments}
								</span>
								<span className="text-[9px] text-gw-muted uppercase tracking-widest">
									Comments
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-lg md:text-xl text-gw-gold font-bold leading-none">
									{user._count.following}
								</span>
								<span className="text-[9px] text-gw-muted uppercase tracking-widest">
									Following
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-lg md:text-xl text-gw-gold font-bold leading-none">
									{user._count.followers}
								</span>
								<span className="text-[9px] text-gw-muted uppercase tracking-widest">
									Followers
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* main */}
			<div className="max-w-4xl mx-auto px-6 mt-10 flex flex-col gap-12">
				{/* Privacy Check Wrapper */}
				{!canViewDetails ? (
					<div className="flex flex-col items-center justify-center py-20 border border-gw-gold/10 bg-gw-surface2/30 rounded-sm">
						<span className="text-3xl mb-4">🔒</span>
						<h2 className="text-sm font-bold text-gw-white tracking-widest uppercase mb-2">
							This Account is Private
						</h2>
						<p className="text-xs text-gw-muted">
							Follow to see their ratings, watchlist, and reviews.
						</p>
					</div>
				) : (
					<>
						{/* recently rated */}
						<section>
							<div className="flex justify-between items-end border-b border-gw-gold/10 pb-3 mb-4">
								<h2 className="text-xs tracking-widest uppercase text-gw-gold-dim">
									Recently Rated
								</h2>
								{user.ratings.length > 0 && (
									<span className="text-[10px] text-gw-muted uppercase tracking-widest cursor-pointer hover:text-gw-gold transition-colors">
										View All
									</span>
								)}
							</div>

							{user.ratings.length === 0 ? (
								<div className="text-xs text-gw-muted italic">
									No films rated yet.
								</div>
							) : (
								<div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
									{user.ratings.map((ratingItem) => (
										<Link
											key={ratingItem.movie.tmdbId}
											href={`/movie/${ratingItem.movie.tmdbId}`}
											className="aspect-2/3 bg-gw-surface2 border border-gw-gold/15 rounded-sm relative block hover:border-gw-gold/50 transition-colors overflow-hidden"
										>
											{ratingItem.movie.posterPath && (
												<Image
													src={ratingItem.movie.posterPath}
													alt={ratingItem.movie.title}
													fill
													className="object-cover"
													sizes="(max-width: 640px) 33vw, 20vw"
												/>
											)}
											<div className="absolute bottom-0 left-0 right-0 bg-gw-black/90 border-t border-gw-gold/20 p-3 flex justify-center items-center gap-1 text-[10px] text-gw-gold font-extrabold text-s">
												<Star className="w-2.5 h-2.5 fill-current" />{" "}
												{ratingItem.score}
											</div>
										</Link>
									))}
								</div>
							)}
						</section>

						{/* recently watchlist */}
						<section>
							<div className="flex justify-between items-end border-b border-gw-gold/10 pb-3 mb-4">
								<h2 className="text-xs tracking-widest uppercase text-gw-gold-dim">
									Watchlist
								</h2>
								{user.watchlist.length > 0 && (
									<span className="text-[10px] text-gw-muted uppercase tracking-widest cursor-pointer hover:text-gw-gold transition-colors">
										View All
									</span>
								)}
							</div>

							{user.watchlist.length === 0 ? (
								<div className="text-xs text-gw-muted italic">
									Watchlist is empty.
								</div>
							) : (
								<div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
									{user.watchlist.map((watchlistItem) => (
										<Link
											key={watchlistItem.movie.tmdbId}
											href={`/movie/${watchlistItem.movie.tmdbId}`}
											className="aspect-2/3 bg-gw-surface2 border border-gw-gold/15 rounded-sm relative block hover:border-gw-gold/50 transition-colors overflow-hidden"
										>
											{watchlistItem.movie.posterPath && (
												<Image
													src={watchlistItem.movie.posterPath}
													alt={watchlistItem.movie.title}
													fill
													className="object-cover"
													sizes="(max-width: 640px) 33vw, 20vw"
												/>
											)}
										</Link>
									))}
								</div>
							)}
						</section>

						{/* recent comments */}
						<section>
							<div className="flex justify-between items-end border-b border-gw-gold/10 pb-3 mb-4">
								<h2 className="text-xs tracking-widest uppercase text-gw-gold-dim">
									Recent comments
								</h2>
								{user.comments.length > 0 && (
									<span className="text-[10px] text-gw-muted uppercase tracking-widest cursor-pointer hover:text-gw-gold transition-colors">
										View All
									</span>
								)}
							</div>

							{user.comments.length === 0 ? (
								<div className="text-xs text-gw-muted italic">
									No comments written yet.
								</div>
							) : (
								<div className="flex flex-col gap-4">
									{user.comments.map((comment, idx) => (
										<Link
											key={idx}
											href={`/movie/${comment.movie.tmdbId}`}
											className="bg-gw-gold/5 border border-gw-gold/10 rounded-sm p-4 flex gap-4 hover:bg-gw-gold/10 transition-colors"
										>
											{/* Small thumbnail for the comment */}
											<div className="w-12 h-16 sm:w-16 sm:h-24 shrink-0 bg-gw-surface2 border border-gw-gold/15 rounded-sm relative overflow-hidden">
												{comment.movie.posterPath && (
													<Image
														src={comment.movie.posterPath}
														alt={comment.movie.title}
														fill
														className="object-cover"
														sizes="(max-width: 640px) 48px, 64px"
													/>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<h3 className="text-sm font-bold text-gw-white mb-1">
													{comment.movie.title}
												</h3>
												<div className="text-xs text-gw-gold-dim mb-2">
													{new Date(comment.createdAt).toLocaleDateString()}
												</div>
												<p className="text-xs text-gw-muted line-clamp-3 italic">
													"{comment.content}"
												</p>
											</div>
										</Link>
									))}
								</div>
							)}
						</section>
					</>
				)}
			</div>
		</div>
	);
}
