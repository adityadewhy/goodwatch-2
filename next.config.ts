import type {NextConfig} from "next";

const nextConfig: NextConfig = {
	/* config options here */

	allowedDevOrigins: ["192.168.1.39"],

	images: {
		remotePatterns: [
			{protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**"},
		],
	},
};

export default nextConfig;
