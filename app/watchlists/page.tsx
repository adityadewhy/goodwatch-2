"use client";

import Topbar from "@/components/Topbar";
import {formatDate, formatMediaType} from "@/lib/format";
import {
	Film,
	Tv,
	ChevronLeft,
	ChevronRight,
	X,
	BookmarkMinus,
} from "lucide-react";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";

type WatchlistItem = {
	addedAt: string;
	movie: {
		tmdbId: number;
		title: string;
		year: number | null;
		posterPath: string | null;
		mediaType: string;
	};
};

export default function WatchlistPage() {
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState("date-desc");
	const [items, setItems] = useState<WatchlistItem[]>([]);
	const [totalPages, setTotalPages] = useState(1);

	// for overlay
	const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		async function fetchWatchlist() {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/user/watchlists?page=${page}&sort=${sort}`,
				);
				if (res.ok) {
					const data = await res.json();
					setItems(data.items);
					setTotal(data.total);
					setTotalPages(data.totalPages);
				}
			} catch (error) {
				console.error("Failed to fetch watchlist", error);
			} finally {
				setLoading(false);
			}
		}
		fetchWatchlist();
	}, [page, sort]);

	const handleSort = (newSort: string) => {
		setSort(newSort);
		setPage(1);
	};

	const closeModal = () => {
		setSelectedItem(null);
	};

	const handleRemove = async () => {
		if (!selectedItem) return;
		setIsSaving(true);
		try {
			await fetch(`/api/movies/${selectedItem.movie.tmdbId}/watchlist`, {
				method: "DELETE",
			});
			// Optimistic UI update
			setItems((prev) =>
				prev.filter((i) => i.movie.tmdbId !== selectedItem.movie.tmdbId),
			);
			setTotal((prev) => prev - 1);
			closeModal();
		} catch (error) {
			console.error("Failed to remove from watchlist", error);
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
						Your Watchlist
					</h1>
					<div className="text-xs tracking-widest text-gw-muted uppercase">
						{total} films & shows saved
					</div>
				</div>

				{/* Sort Bar */}
				<div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
					<span className="text-xs tracking-widest uppercase text-gw-muted shrink-0 mr-2">
						Sort by
					</span>
					<button
						onClick={() => handleSort("date-desc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "date-desc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Recently Added
					</button>
					<button
						onClick={() => handleSort("date-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "date-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Oldest Added
					</button>
					<button
						onClick={() => handleSort("title-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "title-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						A-Z
					</button>
				</div>

				{/* Main Grid */}
				{loading ? (
					<div className="flex justify-center py-20">
						<div className="w-8 h-8 border-2 border-gw-muted border-t-gw-gold rounded-full animate-spin" />
					</div>
				) : items.length === 0 ? (
					<div className="text-center py-20 text-gw-muted border border-dashed border-gw-gold/20 rounded-sm bg-gw-surface2/30">
						Your watchlist is empty. Go find some movies!
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{items.map((item) => (
							<div
								key={item.movie.tmdbId}
								onClick={() => setSelectedItem(item)}
								className="bg-[#111] border border-gw-gold/10 rounded-sm overflow-hidden cursor-pointer group hover:border-gw-gold/40 transition-all flex flex-col"
							>
								<div className="aspect-2/3 relative bg-gw-surface2 flex items-center justify-center">
									{item.movie.posterPath ? (
										<Image
											src={item.movie.posterPath}
											alt={item.movie.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-500"
											sizes="(max-width: 640px) 50vw, 20vw"
										/>
									) : item.movie.mediaType === "TV" ? (
										<Tv className="w-8 h-8 text-gw-gold/20" />
									) : (
										<Film className="w-8 h-8 text-gw-gold/20" />
									)}
									<div className="bg-linear-to-b from-[#111] via-transparent to-transparent opacity-80 absolute inset-0" />
								</div>

								<div className="p-2 flex flex-col flex-1">
									<div className="text-sm font-semibold text-gw-white truncate mb-1 mt-1">
										{item.movie.title}
									</div>
									<div className="text-xs text-gw-muted mb-3">
										{item.movie.year || "Unknown year"}
									</div>

									<div className="mt-auto flex items-center justify-end">
										<div className="text-xs text-gw-muted/60">
											Added {formatDate(item.addedAt)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Pagination */}
				{!loading && totalPages > 1 && (
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

			{/* Overlay Modal */}
			{selectedItem && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
							{/* Movie Info */}
							<div className="flex gap-4 mb-6 border-b border-gw-gold/10 pb-6">
								<div className="relative w-16 h-24 bg-gw-surface2 shrink-0 rounded-sm overflow-hidden border border-gw-gold/10">
									{selectedItem.movie.posterPath ? (
										<Image
											src={selectedItem.movie.posterPath}
											alt={selectedItem.movie.title}
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
										{selectedItem.movie.title}
									</h2>
									<div className="text-xs tracking-widest text-gw-muted uppercase mb-3">
										{selectedItem.movie.year} •{" "}
										{formatMediaType(selectedItem.movie.mediaType)}
									</div>
									<div className="text-xs text-gw-gold-dim italic">
										Added to Watchlist on {formatDate(selectedItem.addedAt)}
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3">
								<Link
									href={`/movie/${selectedItem.movie.tmdbId}`}
									className="flex-1 py-2.5 border border-gw-gold/20 text-gw-muted text-xs uppercase tracking-widest text-center rounded-sm hover:text-gw-white transition-colors"
								>
									View Movie
								</Link>

								<button
									onClick={handleRemove}
									disabled={isSaving}
									className="flex-1 py-2.5 flex justify-center items-center gap-2 border border-gw-error/30 text-gw-error/80 text-xs uppercase tracking-widest font-bold text-center rounded-sm hover:text-gw-error hover:border-gw-error disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<BookmarkMinus className="w-4 h-4" />
									{isSaving ? "Removing..." : "Remove"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
