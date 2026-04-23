"use client";

import Topbar from "@/components/Topbar";
import {formatDate, formatMediaType} from "@/lib/format";

import {Star, Film, Tv, ChevronLeft, ChevronRight, X} from "lucide-react";

import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";

type RatingItem = {
	score: number;
	createdAt: string;
	updatedAt: string;
	movie: {
		tmdbId: number;
		title: string;
		year: number | null;
		posterPath: string | null;
		mediaType: string;
	};
};

export default function RatingsPage() {
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState("date-desc");
	const [ratings, setRatings] = useState<RatingItem[]>([]);
	const [totalPages, setTotalPages] = useState(1);

	// for overlay
	const [selectedRating, setSelectedRating] = useState<RatingItem | null>(null);
	const [editScore, setEditScore] = useState<number>(0);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		async function fetchRatings() {
			setLoading(true);
			try {
				const res = await fetch(`/api/user/ratings?page=${page}&sort=${sort}`);
				if (res.ok) {
					const data = await res.json();
					setRatings(data.ratings);
					setTotal(data.total);
					setTotalPages(data.totalPages);
				}
			} catch (error) {
				console.error("Failed to fetch ratings", error);
			} finally {
				setLoading(false);
			}
		}
		fetchRatings();
	}, [page, sort]);

	const handleSort = (newSort: string) => {
		setSort(newSort);
		setPage(1);
	};

	// for overlay
	const openModal = (item: RatingItem) => {
		setSelectedRating(item);
		setEditScore(item.score);
	};

	const closeModal = () => {
		setSelectedRating(null);
		setEditScore(0);
	};

	const handleUpdate = async () => {
		if (!selectedRating || editScore === selectedRating.score)
			return closeModal();

		setIsSaving(true);
		try {
			await fetch(`/api/movies/${selectedRating.movie.tmdbId}/rate`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({score: editScore}),
			});

			const now = new Date().toISOString();

			setRatings((prev) =>
				prev.map((r) =>
					r.movie.tmdbId === selectedRating.movie.tmdbId
						? {...r, score: editScore, updatedAt: now}
						: r,
				),
			);
			closeModal();
		} catch (error) {
			console.error("Failed to update", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedRating) return;

		setIsSaving(true);

		try {
			await fetch(`/api/movies/${selectedRating.movie.tmdbId}/rate`, {
				method: "DELETE",
			});

			setRatings((prev) =>
				prev.filter((r) => r.movie.tmdbId !== selectedRating.movie.tmdbId),
			);
			setTotal((prev) => prev - 1);
			closeModal();
		} catch (error) {
			console.error("Failed to delete", error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="min-h-screen pt-14 bg-gw-black text-gw-white font-sans pb-20">
			<Topbar />

			<div className="max-w-6xl mx-auto px-6 pt-10">
				<div className="flex flex-col justify-between border-b border-gw-gold/10 pb-6 mb-6 gap-6">
					<h1 className="text-3xl md:text-4xl font-bold font-playfair text-gw-white mb-2">
						Your Ratings
					</h1>

					<div className="text-xs tracking-widest text-gw-muted uppercase">
						{total} films & shows rated
					</div>
				</div>

				<div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
					<span className="text-xs tracking-widest uppercase text-gw-muted shrink-0 mr-2">
						Sort by
					</span>

					<button
						onClick={() => handleSort("date-desc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "date-desc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Latest Rated
					</button>

					<button
						onClick={() => handleSort("date-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "date-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Oldest Rated
					</button>

					<button
						onClick={() => handleSort("score-desc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "score-desc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Best Rated
					</button>

					<button
						onClick={() => handleSort("score-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "score-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Worst Rated
					</button>

					<button
						onClick={() => handleSort("title-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "title-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						A-Z
					</button>
				</div>

				{/* main */}
				{loading ? (
					<div className="flex justify-center py-20">
						<div className="w-8 h-8 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
					</div>
				) : ratings.length === 0 ? (
					<div className="text-center py-20 text-gw-muted border border-dashed border-gw-gold/20 rounded-sm bg-gw-surface2/30">
						You haven't rated any movies or shows yet.
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{ratings.map((item) => (
							<div
								key={item.movie.tmdbId}
								onClick={() => openModal(item)}
								className="bg-[#111] border border-gw-gold/10 rounded-sm overflow-hidden cursor-pointer group hover:border-gw-gold/40 transition-all flex flex-col"
							>
								<div className="aspect-2/3 relative bg-gw-surface2 flex items-center justify-center">
									{item.movie.posterPath ? (
										<Image
											src={item.movie.posterPath}
											alt={item.movie.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-500"
											sizes="{max-width:640px} 50vw,20vw"
										/>
									) : item.movie.mediaType === "TV" ? (
										<Tv className="w-8 h-8 text-gw-gold/20" />
									) : (
										<Film className="w-8 h-8 text-gw-gold/20" />
									)}

									<div className="bg-linear-to-b from-[#111] via-transparent to-transparent opacity-80" />
								</div>

								<div className="p-2 flex flex-col flex-1">
									<div className="text-sm font-semibold text-gw-white truncate mb-1 mt-1">
										{item.movie.title}
									</div>
									<div className="text-xs text-gw-muted mb-3">
										{item.movie.year || "Unknown year"}
									</div>

									<div className="mt-auto flex items-center justify-between">
										<div className="flex items-center gap-1 text-gw-gold">
											<Star className="w-3 h-3 fill-current" />
											<span className="text-xs font-bold">{item.score}</span>
										</div>

										<div className="text-xs text-gw-muted/60">
											{formatDate(item.updatedAt)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* pagination */}
				{!loading && (
					<div className="flex items-center justify-center gap-6 pt-12 border-t border-gw-gold/10 mt-12">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="p-2 border border-gw-gold/20 rounded-sm text-gw-muted hover:text-gw-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>

						<span className="text-xs tracking-widest uppercase text-gw-muted">
							Page <span className="text-gw-gold font-bold">{page}</span> of{" "}
							{totalPages}
						</span>

						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="p-2 border border-gw-gold/20 rounded-sm text-gw-muted hover:text-gw-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			{/* overlay */}
			{selectedRating && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
					<div
						className="relative bg-[#111] border border-gw-gold/20 rounded-sm w-full max-w-md shadow-2xl animate-fade-up"
						style={{animationDuration: "200ms"}}
					>
						<button
							onClick={closeModal}
							className="absolute top-4 right-4 text-gw-muted hover:text-gw-white transition-colors"
						>
							<X className="w-5 h-5" />
						</button>

						<div className="p-6">
							{/* movie info */}
							<div className="flex gap-4 mb-6 border-b border-gw-gold/10 pb-6">
								<div className="relative w-16 h-24 bg-gw-surface2 shrink-0 rounded-sm overflow-hidden border border-gw-gold/10">
									{selectedRating.movie.posterPath ? (
										<Image
											src={selectedRating.movie.posterPath}
											alt={selectedRating.movie.title}
											fill
											className="object-cover"
											sizes="64px"
										/>
									) : (
										<Film className="w-6 h-6 text-gw-gold/20 m-auto mt-8" />
									)}
								</div>

								<div className="flex flex-col justify-center">
									<h2 className="text-xl font-bold font-playfair text-gw-white mb-1 line-clamp-2">
										{selectedRating.movie.title}
									</h2>

									<div className="text-xs tracking-widest text-gw-muted uppercase mb-3">
										{selectedRating.movie.year}{" "}
										{formatMediaType(selectedRating.movie.mediaType)}
									</div>
								</div>
							</div>

							{/* change section */}
							<div className="mb-8">
								<div className="flex justify-between w-full mb-6">
									<div className="text-sm">
										Your Rating: {selectedRating.score}
									</div>
									<div className="text-xs text-gw-muted italic">
										Rated on {formatDate(selectedRating.updatedAt)}
									</div>
								</div>

								<div className="text-xs leading-relaxed text-gw-gold-dim uppercase mb-3">
									Change Rating
								</div>
								<div className="flex gap-1">
									{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
										<button
											key={star}
											onClick={() => setEditScore(star)}
											className="group cursor-pointer p-0.5"
											title={`Rate ${star}/10`}
										>
											<Star
												className={`w-6 h-6 transition-colors ${editScore >= star ? "text-gw-gold fill-current" : "text-gw-gold/20 group-hover:text-gw-gold/50"}`}
											/>
										</button>
									))}
								</div>
							</div>

							{/* actions */}
							<div className="flex gap-3 mt-6">
								<Link
									href={`/movie/${selectedRating.movie.tmdbId}`}
									className="flex-1 p-1 border border-gw-gold/20 text-gw-muted text-xs uppercase tracking-widest text-center rounded-sm hover:text-gw-white transition-colors"
								>
									View Movie
								</Link>

								<button
									onClick={handleUpdate}
									disabled={isSaving || editScore === selectedRating.score}
									className="flex-1 p-1 font-bold bg-gw-gold text-gw-black text-xs uppercase tracking-widest text-center rounded-sm hover:bg-[#e8c97a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
								>
									{isSaving ? "Saving..." : "Update"}
								</button>
							</div>

							<div className="flex-1 mt-4 p-4 border-t border-gw-gold/10 text-center">
								<button
									onClick={handleDelete}
									disabled={isSaving}
									className="text-xs p-1 *:uppercase tracking-widest text-gw-error/50 border border-gw-gold/20 hover:text-gw-error transition-colors font-bold cursor-pointer"
								>
									Delete Rating
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
