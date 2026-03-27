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
	overview: string;
	vote_average: number;
	credits?: {
		cast: {name: string; character: string; order: number}[];
		crew: {name: string; job: string}[];
	};
};

export function getPosterUrl(posterPath: string | null): string | null {
	if (!posterPath) return null;
	return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export async function searchMovies(query: string) {
	const res = await fetch(
		`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false`,
		{headers},
	);

	if (!res.ok) throw new Error("TMDB search failed");

	const data = await res.json();
	return data.results as TMDBMovie[];
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie> {
	const res = await fetch(
		`${TMDB_BASE}/movie/${tmdbId}?append_to_response=credits`,
		{headers},
	);

	if (!res.ok) throw new Error("tmdb fetch failed");

	return res.json();
}
