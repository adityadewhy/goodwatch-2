"use client";

import {Search, Bookmark, Star, Users, Menu, LogOut} from "lucide-react";

import {useRouter} from "next/navigation";
import {useEffect, useState, useRef} from "react";
import Link from "next/link";
import Image from "next/image";

type MovieResult = {
	tmdbId: number;
	mediaType: "movie" | "tv";
	title: string;
	year: number | null;
	posterUrl: string | null;
	rating: number;
};

type UserResult = {
	username: string;
};

type SearchResults = {
	movies: MovieResult[];
	users: UserResult[];
};

export default function Topbar({username}: {username: string}) {
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResults>({
		movies: [],
		users: [],
	});
	const [searchOpen, setSearchOpen] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);

	//close search dropdown, if clicked outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
				setSearchOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [router]);

	//debounce search/[]
	useEffect(() => {
		if (searchQuery.trim().length < 2) {
			setSearchResults({movies: [], users: []});
			setSearchOpen(false);
			return;
		}

		const timerId = setTimeout(async () => {
			setIsSearching(true);
			try {
				const [moviesRes, usersRes] = await Promise.all([
					fetch(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`),
					fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`),
				]);

				const moviesData = await moviesRes.json();
				const usersData = await usersRes.json();

				setSearchResults({
					movies: moviesData.movies?.slice(0, 5) ?? [],
					users: usersData.users?.slice(0, 3) ?? [],
				});
				setSearchOpen(true);
			} catch {
				//not required
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timerId);
	}, [searchQuery]);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", {method: "POST"});
		router.push("/login");
	};

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-gw-surface/90 backdrop-blur-md border-b border-gw-gold/15">
			<div className="flex items-center h-14 gap-4 px-6">
				{/* logo-home */}
				<Link
					href="/home"
					className="font-playfair text-xl text-gw-gold shrink-0"
				>
					Good<span className="text-gw-white italic">Watch</span>
				</Link>

				{/* search-desktop */}
				<div
					ref={searchRef}
					className="relative flex-1 max-w-md hidden sm:block"
				>
					<div className="flex items-center gap-2 bg-gw-surface2 border border-gw-gold/15 rounded-sm px-3 h-9 transition-colors focus-within:border-gw-gold/40">
						<Search
							className="w-3.5 h-3.5 text-gw-muted shrink-0"
							strokeWidth={2}
						/>

						<input
							type="text"
							placeholder="Search people, movies or shows"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="bg-transparent text-gw-white text-sm placeholder:text-gw-muted outline-none w-full font-light"
						/>

						{isSearching && (
							<div className="w-3 h-3 border border-gw-muted border-t-gw-gold rounded-full animate-spin shrink-0" />
						)}
					</div>

					{/* search dropdown */}
					{searchOpen &&
						(searchResults.movies.length > 0 ||
							searchResults.users.length > 0) && (
							<div className="absolute top-full left-0 right-0 mt-px bg-gw-surface border border-gw-gold/15 border-t-0 rounded-b-sm overflow-hidden shadow-2xl">
								{/* movies&shows */}
								{searchResults.movies.length > 0 && (
									<div>
										<div className="text-gw-gold-dim uppercase px-3.5 pt-2.5 pb-1.5 tracking-wide text-[10px]">
											Movies & Shows
										</div>

										{searchResults.movies.map((movie) => (
											<Link
												key={movie.tmdbId}
												href={`/movie/${movie.tmdbId}`}
												onClick={() => setSearchOpen(false)}
												className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-gw-surface2 transition-colors cursor-pointer"
											>
												{/* poster */}
												<div className="w-14 h-20 bg-gw-surface2 border border-gw-gold/10 rounded-sm shrink-0 flex items-center justify-center overflow-hidden">
													{movie.posterUrl ? (
														<Image
															src={movie.posterUrl}
															alt="movieImage"
															width={14}
															height={20}
															className="w-full h-full object-cover"
														/>
													) : (
														<Search className="w-3 h-3 text-gw-gold-dim" />
													)}
												</div>

												<div className="flex-1">
													<div className="text-base text-gw-white truncate leading-relaxed">
														{movie.title}
													</div>

													<div className="flex items-center gap-1.5 mt-px">
														<span className="text-sm text-gw-muted">
															{movie.year || "Unknown"}
														</span>
														<span className="text-xs uppercase tracking-widest text-gw-gold-dim border border-gw-gold-dim/40 px-1 py-px rounded-sm">
															{movie.mediaType === "tv" ? "Show" : "Film"}
														</span>
													</div>
												</div>
												{/* rating */}
												<div className="flex items-center gap-1 text-sm text-gw-gold shrink-0">
													<Star className="w-2.5 h-2.5 fill-current" />
													{movie.rating ? movie.rating.toFixed(1) : "N/A"}
												</div>
											</Link>
										))}
									</div>
								)}

								{/* divider if both */}
								{searchResults.movies.length > 0 &&
									searchResults.users.length > 0 && (
										<div className="h-px bg-gw-gold/10 mx-3.5 my-1" />
									)}

								{/* users */}
								{searchResults.users.length > 0 && (
									<div>
										<div className="text-gw-gold-dim uppercase px-3.5 pt-2.5 pb-1.5 tracking-wide text-[10px]">
											People
										</div>
										{searchResults.users.map((user) => (
											<Link
												key={user.username}
												href={`/profile/${user.username}`}
												onClick={() => setSearchOpen(false)}
												className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-gw-surface2 transition-colors cursor-pointer"
											>
												<div className="w-7 h-7 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-xs text-gw-gold font-medium shrink-0">
													{user.username.slice(0, 2).toUpperCase()}
												</div>
												<div className="text-sm text-gw-white truncate flex-1">
													{user.username}
												</div>
											</Link>
										))}
									</div>
								)}
							</div>
						)}
				</div>

				{/* empty div takes up remaining space  */}
				<div className="flex-1 hidden sm:block"></div>

				<div className="hidden sm:flex items-center gap-1">
					{/* watchlist */}
					<Link
						href="/watchlist"
						className="flex items-center gap-1.5 px-3 h-9 text-gw-muted hover:text-gw-white transition-color text-xs tracking-widest uppercase"
					>
						<Bookmark
							className="w-3.5 h-3.5 text-gw-muted shrink-0"
							strokeWidth={2}
						/>
						Watchlist
					</Link>

					{/* Ratings */}
					<Link
						href="/ratings"
						className="flex items-center gap-1.5 px-3 h-9 text-gw-muted hover:text-gw-white transition-color text-xs tracking-widest uppercase"
					>
						<Star
							className="w-3.5 h-3.5 text-gw-muted shrink-0"
							strokeWidth={2}
						/>
						Ratings
					</Link>

					{/* Friends */}
					<Link
						href="/friends"
						className="flex items-center gap-1.5 px-3 h-9 text-gw-muted hover:text-gw-white transition-color text-xs tracking-widest uppercase"
					>
						<Users
							className="w-3.5 h-3.5 text-gw-muted shrink-0"
							strokeWidth={2}
						/>
						Friends
					</Link>

					{/* avatar */}
					<Link
						href={`/profile/${username}`}
						className="w-8 h-8 rounded-full bg-gw-gold/10 border border-gw-gold/25 flex items-center justify-center text-gw-gold text-xs font-bold hover:bg-gw-gold/20 transition-colors ml-6"
					>
						{username.slice(0, 2).toUpperCase()}
					</Link>
				</div>

				{/* mobile */}
			</div>
		</nav>
	);
}
