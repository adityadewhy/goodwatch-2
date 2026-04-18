import {Star, Tv, Heart, Bookmark} from "lucide-react";
import Link from "next/link";

type FriendActivity = {
	username: string;
	rating: number | null;
	comment: string | null;
	inWatchlist: boolean;
	isProfile: boolean;
	isCover: boolean;
};

export default function FollowingActivity({
	friends,
}: {
	friends: FriendActivity[];
}) {
	if (friends.length === 0) return null;

	return (
		<div className="p-5 border-b border-gw-gold/10 bg-gw-gold/20">
			<div className="text-xs tracking-widest uppercase text-gw-gold-dim mb-4 flex items-center gap-2">
				Following Activity
				<div className="flex-1 h-px bg-gw-gold/10" />
			</div>

			<div className="flex flex-col gap-3">
				{friends.map((friend) => (
					<div
						key={friend.username}
						className="bg-gw-gold/5 border border-gw-gold/10 rounded-sm p-4"
					>
						<div className="flex justify-between items-start mb-2">
							<div className="flex items-start gap-3 min-w-0">
								<Link
									href={`/profile/${friend.username}`}
									className="w-8 h-8 rounded-full bg-gw-gold/10 border border-gw-gold/20 flex items-center justify-center text-xs text-gw-gold font-bold hover:bg-gw-gold/20 transition-colors shrink-0 mt-0.5"
								>
									{friend.username.slice(0, 2).toUpperCase()}
								</Link>

								<div className="flex flex-col min-w-0">
									<Link
										href={`/profile/${friend.username}`}
										className="text-sm font-semibold text-gw-white hover:text-gw-gold transition-colors truncate"
									>
										{friend.username}
									</Link>

									<div className="flex flex-wrap gap-1.5 mt-1">
										{friend.isCover && (
											<span className="flex items-center justify-center gap-1 text-xs uppercase leading-none bg-gw-error/10 text-gw-error border-gw-error/20 px-1.5 py-0.5 rounded-sm shrink-0">
												<Heart className="w-3 h-3 fill-current" />{" "}
												<span>All-Time Favourite</span>
											</span>
										)}
										{friend.isProfile && (
											<span className="flex items-center justify-center gap-1 text-xs uppercase leading-none bg-gw-error/10 text-gw-error border-gw-error/20 px-1.5 py-0.5 rounded-sm shrink-0">
												<Tv className="w-3 h-3 fill-current" />
												<span>Currently Watching</span>
											</span>
										)}
									</div>
								</div>
							</div>
							{friend.inWatchlist && (
								<div className="flex items-center gap-1.5 text-xs text-gw-muted uppercase tracking-widest mt-2">
									<Bookmark className="w-3 h-3" />
									In Watchlist
								</div>
							)}
							{friend.rating && (
								<div className="flex items-center gap-1 bg-gw-gold/10 border border-gw-gold/20 px-2 py-1 rounded-sm text-sm font-bold text-gw-gold shrink-0 ml-3">
									<Star className="w-3 h-3 fill-current" />
									{friend.rating}
								</div>
							)}
						</div>

						{friend.comment && (
							<p className="text-m text-gw-muted font-bold italic leading-relaxed border-l-2 border-gw-gold/20 pl-3 my-3 wrap-break-word">
								"{friend.comment}"
							</p>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
