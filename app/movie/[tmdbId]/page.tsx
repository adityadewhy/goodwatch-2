"use client";
import Topbar from "@/components/Topbar";

import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import Image from "next/image";

import {Star, Plus, Check, Tv, Heart} from "lucide-react";

type MovieData = {
	id: string;
	tmdbId: number;
	title: string;
	year: number | null;
	posterPath: string | null;
	plot: string | null;
	tmdbRating: number | null;
	director: string | null;
	cast: string[];
};

type UserStatus = {
	rating: number | null;
	inWatchlist: boolean;
	comment: {id: string; content: string} | null;
	isProfile: boolean;
	isCover: boolean;
};

export default function MoviePage() {
	const params = useParams();
	const tmdbId = params.tmdbId as string;

	const [movie, setMovie] = useState<MovieData | null>(null);
	const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [showRatingPicker, setShowRatingPicker] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [isEditingComment, setIsEditingComment] = useState(false);

	useEffect(() => {
		if (!tmdbId) return;
		async function fetchData() {
			try {
				const [movieRes, statusRes] = await Promise.all([
					fetch(`/api/movies/${tmdbId}`),
					fetch(`/api/movies/${tmdbId}/status?t=${Date.now()}`),
				]);
				const movieData = await movieRes.json();
				const statusData = await statusRes.json();

				if (movieRes.ok && movieData.movie) {
					setMovie(movieData.movie);
				}
				if (statusRes.ok) {
					setUserStatus(statusData);
				}
			} catch (error) {
				console.error("Failed to fetch movie: ", error);
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, [tmdbId]);

	if (loading) {
		return (
			<div className="min-h-screen pt-14 bg-gw-black flex items-center justify-center">
				<Topbar />
				<div className="w-6 h-6 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
			</div>
		);
	}

	if (!movie) {
		return (
			<div className="min-h-screen pt-14 bg-gw-black flex items-center justify-center text-gw-muted">
				<Topbar />
				Movie not found.
			</div>
		);
	}

	const handleRate = async (score: number | null) => {
		setUserStatus((prev) => (prev ? {...prev, rating: score} : null));

		if (score !== null) setShowRatingPicker(false);

		try {
			if (score === null) {
				await fetch(`/api/movies/${tmdbId}/rate`, {
					method: "DELETE",
				});
			} else {
				await fetch(`/api/movies/${tmdbId}/rate`, {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({score}),
				});
			}
		} catch (error) {
			console.error("Failed to save rating: ", error);
		}
	};

	const toggleWatchlist = async () => {
		const isCurrentlyInList = userStatus?.inWatchlist;
		console.log("iscurrenntlyinlist", isCurrentlyInList);

		setUserStatus((prev) =>
			prev ? {...prev, inWatchlist: !isCurrentlyInList} : null,
		);

		try {
			const res = await fetch(`/api/movies/${tmdbId}/watchlist`, {
				method: isCurrentlyInList ? "DELETE" : "POST",
			});

			if (!res.ok) {
				//revert optimistic ui if fetch fails
				setUserStatus((prev) =>
					prev ? {...prev, inWatchlist: !isCurrentlyInList} : null,
				);
			}
		} catch (error) {
			//revert of error too
			setUserStatus((prev) =>
				prev ? {...prev, inWatchlist: !isCurrentlyInList} : null,
			);
		}
	};

	const handleSetFeature = async (type: "PROFILE" | "COVER") => {
		const previousStatus = userStatus;
		// Optimistic UI update
		setUserStatus((prev) => {
			if (!prev) return null;
			return {
				...prev,
				isProfile: type === "PROFILE" ? true : prev.isProfile,
				isCover: type === "COVER" ? true : prev.isCover,
			};
		});

		try {
			await fetch(`/api/movies/${tmdbId}/feature`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({featureType: type}),
			});
		} catch (error) {
			console.error("Failed to set feature:", error);
			// Ideally revert optimistic update here on fail
			setUserStatus(previousStatus);
		}
	};

	const handleSaveComment = async () => {
		if (!commentText.trim()) return;

		const previousComment = userStatus?.comment;
		const optimisticComment = {id: "temp-id", content: commentText.trim()};

		setUserStatus((prev) =>
			prev ? {...prev, comment: optimisticComment} : null,
		);

		setIsEditingComment(false);

		try {
			const res = await fetch(`/api/movies/${tmdbId}/comments`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({content: commentText.trim()}),
			});

			if (!res.ok) throw new Error("Failed to save");
		} catch (error) {
			console.error(error);

			//rollback on failur
			setUserStatus((prev) =>
				prev ? {...prev, comment: previousComment || null} : null,
			);
		}
	};

	const handleDeleteComment = async () => {
		const previousComment = userStatus?.comment;

		// optimistic ui update
		setUserStatus((prev) => (prev ? {...prev, comment: null} : null));
		setCommentText("");

		try {
			const res = await fetch(`/api/movies/${tmdbId}/comments`, {
				method: "DELETE",
			});

			if (!res.ok) {
				throw new Error("failed to delete");
			}
		} catch (error) {
			console.error(error);
			setUserStatus((prev) =>
				prev ? {...prev, comment: previousComment || null} : null,
			);
		}
	};

	console.log(userStatus);

	return (
		// pt-14 to push all components down by topbar height
		<div className="min-h-screen pt-14 bg-gw-black text-gw-white font-sans pb-12">
			<Topbar />

			{/* hero */}
			<div className="bg-linear-to-b from-[#151410] to-gw-black border-b border-gw-gold/10 px-5 pt-7 pb-6 flex gap-5">
				{/* left -poster */}
				<div className="w-24 h-36 md:w-50 md:h-75 bg-gw-surface2 border border-gw-gold/15 rounded-sm shrink-0 relative overflow-hidden flex items-center justify-center">
					{movie.posterPath ? (
						<Image
							src={movie.posterPath}
							alt={movie.title}
							className="object-cover"
							fill
							sizes="(max-width: 768px) 96px, 128px"
						/>
					) : (
						<div className="text-2xl opacity-20">🎬</div>
					)}

					<div className="absolute inset-0 bg-linear-to-b from-gw-gold/5 to-transparent h-[60%]" />
				</div>

				{/* movie info */}
				<div className="flex-1 min-w-0 flex flex-col justify-center">
					<div className="inline-block text-xs tracking-widest uppercase text-gw-gold-dim border border-gw-gold/40 px-1.5 py-0.5 rounded-sm mb-2 w-fit">
						film
					</div>

					<h1 className="font-playfair text-2xl md:text-3xl font-bold leading-tight text-gw-white mb-2 truncate">
						{movie.title}
					</h1>

					<div className="text-xs md:text-sm text-gw-muted flex items-center gap-2 mb-3">
						<span>{movie.year || "Unknown"}</span>
						{movie.director && (
							<>
								<div className="2-1 h-1 rounded-full bg-gw-muted" />
								<span>{movie.director}</span>
							</>
						)}
					</div>

					{movie.tmdbRating && (
						<div className="flex items-center gap-1.5 bg-gw-gold/10 border border-gw-gold/20 px-2.5 py-1 rounded-sm text-sm text-gw-gold mb-4 w-fit">
							<Star className="w-4 h-4 fill-current" />
							<span className="font-medium">{movie.tmdbRating.toFixed(1)}</span>
							<span className="text-xs text-gw-muted ml-1 uppercase tracking-wider">
								TMDB
							</span>
						</div>
					)}

					<p className="text-sm text-gw-muted leading-relaxed max-w-2xl mb-4 line-clamp-3 md:line-clamp-none">
						{movie.plot || "No overview available"}
					</p>

					{movie.cast && movie.cast.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{movie.cast.map((actor, idx) => (
								<div
									key={idx}
									className="bg-gw-surface2 border border-gw-gold/10 rounded-sm px-2.5 py-1 text-xs text-gw-muted"
								>
									{actor}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* action bar */}
			<div className="flex gap-2 px-6 py-3.5 border-b border-gw-gold/10 bg-[#0d0d0d]">
				{userStatus?.rating ? (
					<button
						onClick={() => setShowRatingPicker(!showRatingPicker)}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-xs tracking-widest uppercase font-medium bg-gw-gold/10 text-gw-gold border border-gw-gold/40 hover:bg-gw-gold/20 transition-colors"
					>
						<Star className="w-3.5 h-3.5 fill-current" />
						Rated {userStatus.rating}
					</button>
				) : (
					<button
						onClick={() => setShowRatingPicker(!showRatingPicker)}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-transparent text-gw-gold border border-gw-gold/30 hover:bg-gw-gold/10 transition-colors"
					>
						<Star className="w-3.5 h-3.5" />
						Rate
					</button>
				)}

				{userStatus?.inWatchlist ? (
					<button
						onClick={toggleWatchlist}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-transparent text-gw-muted border border-gw-gold/15 hover:text-gw-white transition-colors"
					>
						<Check className="w-3.5 h-3.5" />
						Already in Watchlist, Click to remove
					</button>
				) : (
					<button
						onClick={toggleWatchlist}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-gw-gold text-gw-black hover:bg-[#e8c97a] transition-colors"
					>
						<Plus className="w-3.5 h-3.5" strokeWidth={3} />
						Add to Watchlist
					</button>
				)}

				{userStatus?.isProfile ? (
					<div className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-transparent text-gw-muted border border-gw-gold/15 hover:text-gw-white transition-colors">
						<Tv className="w-3.5 h-3.5" strokeWidth={3} />
						Currently Watching
					</div>
				) : (
					<button
						onClick={() => handleSetFeature("PROFILE")}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-gw-gold text-gw-black hover:bg-[#e8c97a] transition-colors"
					>
						<Tv className=" w-3.5 h-3.5" strokeWidth={3} />
						Set as Currently Watching
					</button>
				)}

				{userStatus?.isCover ? (
					<div className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-transparent text-gw-muted border border-gw-gold/15 hover:text-gw-white transition-colors">
						<Heart className="w-3 h-3" />
						All-Time Favorite
					</div>
				) : (
					<button
						onClick={() => handleSetFeature("COVER")}
						className="flex items-center gap-1.5 px-3 h-8 rounded-sm text-[10px] tracking-widest uppercase font-medium bg-gw-gold text-gw-black hover:bg-[#e8c97a] transition-colors"
					>
						<Heart className="w-3 h-3" />
						Set as All-Time Favorite
					</button>
				)}
			</div>

			{showRatingPicker && (
				<div
					className="px-6 py-3 bg-gw-gold/5 border-b border-gw-gold/10 flex items-center gap-3 animate-fade-up"
					style={{animationDuration: "200ms"}}
				>
					<span className="text-xs tracking-widest uppercase text-gw-gold-dim">
						Your Rating
					</span>
					<div className="flex gap-0.5">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
							<button
								key={star}
								onClick={() => handleRate(star)}
								className="group cursor-pointer p-0.5"
								title={`Rate ${star}/10`}
							>
								<Star
									className={`w-5 h-5 transition-colors ${
										userStatus?.rating && star <= userStatus.rating
											? "text-gw-gold fill-current"
											: "text-gw-gold-dim hover:text-gw-gold"
									}`}
								/>
							</button>
						))}
					</div>
					{userStatus?.rating && (
						<button
							onClick={() => handleRate(null)}
							className="text-[9px] text-gw-muted uppercase tracking-widest ml-2 hover:text-gw-error transition-colors border-b border-transparent hover:border-gw-error pb-px"
						>
							Clear
						</button>
					)}
				</div>
			)}

			{/* comment */}
			<div className="p-5 border-b border-gw-gold/10">
				<div className="text-xs tracking-widest uppercase text-gw-gold-dim mb-3.5 flex items-center gap-2">
					Your comment
					<div className="flex-1 h-px bg-gw-gold/10" />
				</div>

				{/* saved comment and not editing */}
				{userStatus?.comment && !isEditingComment ? (
					<div className="bg-gw-gold/5 border border-gw-gold/15 rounded-sm p-3 mb-2">
						{/* 2. Added break-words so long text doesn't cause scrollbars */}
						<p className="text-sm text-gw-white leading-relaxed whitespace-pre-wrap wrap-break-word">
							{userStatus.comment.content}
						</p>
						<div className="flex gap-3 mt-2">
							<button
								onClick={() => {
									setCommentText(userStatus.comment!.content);
									setIsEditingComment(true);
								}}
								className="text-xs tracking-widest uppercase text-gw-muted hover:text-gw-gold transition-colors"
							>
								Edit
							</button>
							<button
								onClick={handleDeleteComment}
								className="text-xs tracking-widest uppercase text-gw-error/80 hover:text-gw-error transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				) : (
					//writing new comment or editing existing
					<div className="flex flex-col gap-2">
						{/* Notice the p-5 wrapper is gone from here now */}
						<div className="bg-gw-surface border border-gw-gold/15 focus-within:border-gw-gold/40 transition-colors rounded-sm p-2.5 flex flex-col">
							<textarea
								value={commentText}
								onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
								placeholder="write a comment... (max 500 chars)"
								// 3. Added w-full and fixed the min-h arbitrary value
								className="w-full bg-transparent text-sm text-gw-white placeholder:text-gw-muted/60 placeholder:italic outline-none resize-none min-h-16"
							/>

							<div className="flex justify-between items-center mt-2">
								<span className="text-xs text-gw-muted">
									{commentText.length}/500
								</span>
							</div>

							<div className="flex gap-2 justify-end">
								{isEditingComment && (
									<button
										onClick={() => setIsEditingComment(false)}
										className="px-3 py-1.5 text-xs uppercase tracking-widest text-gw-muted hover:text-gw-white transition-colors"
									>
										Cancel
									</button>
								)}

								<button
									onClick={handleSaveComment}
									disabled={commentText.trim().length === 0}
									// 4. Fixed the weird invisible space character after rounded-sm
									className="px-4 py-1.5 bg-gw-surface2 border border-gw-gold/20 text-gw-gold text-xs uppercase tracking-widest rounded-sm hover:bg-gw-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Save Comment
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
