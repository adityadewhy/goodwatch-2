import type {Metadata} from "next";
import {Playfair_Display, DM_Sans} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
	subsets: ["latin"],
	weight: ["400", "700"],
	style: ["normal", "italic"],
	variable: "--font-playfair",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500"],
	variable: "--font-dm-sans",
});

export const metadata: Metadata = {
	title: "GoodWatch",
	description: "Social Shows Site",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
			<body>{children}</body>
		</html>
	);
}
