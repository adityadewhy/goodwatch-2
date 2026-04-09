const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const headers = {
	Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
	"Content-Type": "application/json",
};

export type TMDBMovie = {
	id: number;
	title: string;
	release_date: string;
	poster_path: string | null;
	backdrop_path: string | null;
	overview: string;
	vote_average: number;
	credits?: {
		cast: {name: string; character: string; order: number}[];
		crew: {name: string; job: string}[];
	};
};

export type TMDBShow = {
	id: number;
	name: string; // TV uses 'name' not 'title'
	first_air_date: string; // TV uses 'first_air_date' not 'release_date'
	poster_path: string | null;
	backdrop_path: string | null;
	overview: string;
	vote_average: number;
	credits?: {
		cast: {name: string; character: string; order: number}[];
		crew: {name: string; job: string}[];
	};
};

export type TMDBMultiResult =
	| (TMDBMovie & {media_type: "movie"})
	| (TMDBShow & {media_type: "tv"});

export function getPosterUrl(posterPath: string | null): string | null {
	if (!posterPath) return null;
	return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export async function searchMulti(query: string): Promise<TMDBMultiResult[]> {
	const res = await fetch(
		`${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
		{headers},
	);
	if (!res.ok) throw new Error("TMDB search failed");
	const data = await res.json();

	// Filter to only movies and TV shows — exclude people
	return (data.results as TMDBMultiResult[]).filter(
		(r) => r.media_type === "movie" || r.media_type === "tv",
	);
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie> {
	const res = await fetch(
		`${TMDB_BASE}/movie/${tmdbId}?append_to_response=credits`,
		{headers},
	);
	if (!res.ok) throw new Error("TMDB fetch failed");
	return res.json();
}

export async function getShowDetails(tmdbId: number): Promise<TMDBShow> {
	const res = await fetch(
		`${TMDB_BASE}/tv/${tmdbId}?append_to_response=credits`,
		{headers},
	);
	if (!res.ok) throw new Error("TMDB fetch failed");
	return res.json();
}
