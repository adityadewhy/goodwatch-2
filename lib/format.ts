export function formatDate(date: string | Date): string {
	return new Date(date).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatMediaType(mediaType: string): string {
	return mediaType === "TV" ? "Show" : "Film";
}
