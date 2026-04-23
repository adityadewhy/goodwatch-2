"use client";

import Topbar from "@/components/Topbar";
import {formatDate, formatMediaType} from "@/lib/format";
import {Film, Tv, ChevronLeft, ChevronRight, X} from "lucide-react";
import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";

type CommentItem = {
	comment: string;
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

export default function CommentsPage() {
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState("date-desc");
	const [comments, setComments] = useState<CommentItem[]>([]);
	const [totalPages, setTotalPages] = useState(1);

	// for overlay
	const [selectedComment, setSelectedComment] = useState<CommentItem | null>(
		null,
	);
	const [editComment, setEditComment] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		async function fetchComments() {
			setLoading(true);
			try {
				const res = await fetch(`/api/user/comments?page=${page}&sort=${sort}`);
				if (res.ok) {
					const data = await res.json();
					setComments(data.comments);
					setTotal(data.total);
					setTotalPages(data.totalPages);
				}
			} catch (error) {
				console.error("Failed to fetch comments", error);
			} finally {
				setLoading(false);
			}
		}
		fetchComments();
	}, [page, sort]);

	const handleSort = (newSort: string) => {
		setSort(newSort);
		setPage(1);
	};

	// for overlay
	const openModal = (item: CommentItem) => {
		setSelectedComment(item);
		setEditComment(item.comment);
	};

	const closeModal = () => {
		setSelectedComment(null);
		setEditComment("");
	};

	const handleUpdate = async () => {
		if (!selectedComment || editComment?.trim() === selectedComment.comment)
			return closeModal();

		setIsSaving(true);
		try {
			await fetch(`/api/movies/${selectedComment.movie.tmdbId}/comments`, {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({content: editComment}),
			});

			const now = new Date().toISOString();

			setComments((prev) =>
				prev.map((c) =>
					c.movie.tmdbId === selectedComment.movie.tmdbId
						? {...c, comment: editComment!, updatedAt: now}
						: c,
				),
			);
			closeModal();
		} catch (error) {
			console.error("Failed to update comment", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedComment) return;

		setIsSaving(true);
		try {
			await fetch(`/api/movies/${selectedComment.movie.tmdbId}/comments`, {
				method: "DELETE",
			});

			setComments((prev) =>
				prev.filter((c) => c.movie.tmdbId !== selectedComment.movie.tmdbId),
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
						Your Comments
					</h1>
					<div className="text-xs tracking-widest text-gw-muted uppercase">
						{total} films & shows commented
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
						Latest Comment
					</button>
					<button
						onClick={() => handleSort("date-asc")}
						className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded-sm shrink-0 transition-colors border ${sort === "date-asc" ? "bg-gw-gold/10 border-gw-gold/40 text-gw-gold" : "bg-transparent border-gw-gold/15 text-gw-muted hover:text-gw-white"}`}
					>
						Oldest Comment
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
				) : comments.length === 0 ? (
					<div className="text-center py-20 text-gw-muted border border-dashed border-gw-gold/20 rounded-sm bg-gw-surface2/30">
						You haven't commented on any movies or shows yet.
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{comments.map((eachComment) => (
							<div
								key={eachComment.movie.tmdbId}
								onClick={() => openModal(eachComment)}
								className="bg-[#111] border border-gw-gold/10 rounded-sm overflow-hidden cursor-pointer group hover:border-gw-gold/40 transition-all flex h-40"
							>
								{/* Left: Poster */}
								<div className="w-28 shrink-0 relative bg-gw-surface2 flex items-center justify-center border-r border-gw-gold/10">
									{eachComment.movie.posterPath ? (
										<Image
											src={eachComment.movie.posterPath}
											alt={eachComment.movie.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-500"
											sizes="(max-width: 640px) 30vw, 15vw"
										/>
									) : eachComment.movie.mediaType === "TV" ? (
										<Tv className="w-6 h-6 text-gw-gold/20" />
									) : (
										<Film className="w-6 h-6 text-gw-gold/20" />
									)}

									<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10 group-hover:scale-105 transition-transform duration-500" />

									<div className="absolute bottom-2 left-2 right-2 z-20">
										<div className="text-xs font-bold text-gw-white truncate drop-shadow-2xl">
											{eachComment.movie.title}
										</div>
										<div className="text-[9px] text-gw-muted">
											{eachComment.movie.year || "Unknown"}
										</div>
									</div>
								</div>

								{/* Right: Comment */}
								<div className="flex-1 p-4 flex flex-col justify-between min-w-0">
									<p className="text-xs font-medium text-gw-muted italic leading-relaxed line-clamp-4 wrap-break-word border-l-2 border-gw-gold/20 pl-3">
										"{eachComment.comment}"
									</p>
									<div className="text-[9px] text-gw-gold-dim text-right mt-2 uppercase tracking-widest">
										{formatDate(eachComment.updatedAt)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* pagination */}
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

			{/* overlay */}
			{selectedComment && (
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
							{/* Modal Header */}
							<div className="flex gap-4 mb-6 border-b border-gw-gold/10 pb-6">
								<div className="relative w-16 h-24 bg-gw-surface2 shrink-0 rounded-sm overflow-hidden border border-gw-gold/10">
									{selectedComment.movie.posterPath ? (
										<Image
											src={selectedComment.movie.posterPath}
											alt={selectedComment.movie.title}
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
										{selectedComment.movie.title}
									</h2>
									<div className="text-xs tracking-widest text-gw-muted uppercase mb-2">
										{selectedComment.movie.year} •{" "}
										{formatMediaType(selectedComment.movie.mediaType)}
									</div>
									<div className="text-[10px] text-gw-gold-dim italic">
										Last updated {formatDate(selectedComment.updatedAt)}
									</div>
								</div>
							</div>

							{/* Edit Textarea */}
							<div className="mb-6">
								<div className="text-[10px] tracking-[0.15em] text-gw-gold-dim uppercase mb-3">
									Edit Comment
								</div>
								<div className="bg-gw-surface2 border border-gw-gold/15 focus-within:border-gw-gold/40 transition-colors rounded-sm p-3 flex flex-col">
									<textarea
										value={editComment}
										onChange={(e) =>
											setEditComment(e.target.value.slice(0, 500))
										}
										placeholder="Write a comment... (max 500 chars)"
										className="w-full bg-transparent text-sm text-gw-white placeholder:text-gw-muted/60 outline-none resize-none min-h-25"
									/>
									<div className="flex justify-end mt-2">
										<span className="text-[10px] text-gw-muted">
											{editComment?.length || 0}/500
										</span>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3 mt-4">
								<Link
									href={`/movie/${selectedComment.movie.tmdbId}`}
									className="flex-1 py-2.5 border border-gw-gold/20 text-gw-muted text-xs uppercase tracking-widest text-center rounded-sm hover:text-gw-white transition-colors"
								>
									View Movie
								</Link>
								<button
									onClick={handleUpdate}
									disabled={isSaving || editComment === selectedComment.comment}
									className="flex-1 py-2.5 font-bold bg-gw-gold text-gw-black text-xs uppercase tracking-widest text-center rounded-sm hover:bg-[#e8c97a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{isSaving ? "Saving..." : "Update"}
								</button>
							</div>

							<div className="mt-4 pt-4 border-t border-gw-gold/10 text-center">
								<button
									onClick={handleDelete}
									disabled={isSaving}
									className="text-xs uppercase tracking-widest text-gw-error/80 p-2.5 border border-gw-gold/20 rounded-sm hover:text-gw-error transition-colors font-bold"
								>
									Delete Comment
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
