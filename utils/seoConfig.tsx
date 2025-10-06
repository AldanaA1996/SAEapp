import type { ManifestOptions } from "vite-plugin-pwa"

const NAME = "LEIA"
const SHORT_NAME = "LEIA"
const DESCRIPTION =
	"LEIA is a stock management system that helps you manage your stock efficiently and effectively. It provides a user-friendly interface and powerful features to help you keep track of your stock levels and new entries."

/**
 * Defines the default SEO configuration for the website.
 */
export const seoConfig = {
	baseURL: "https://leia-eze.netlify.app/", // Change this to your production URL.
	description: DESCRIPTION, // Change this to be your website's description.
	type: "website",
	image: {
		url: "https://picsum.photos/1200/630", // Change this to your website's thumbnail.
		alt: NAME, // Change this to your website's thumbnail description.
		width: 1200,
		height: 630
	},
	siteName: NAME,
	twitter: {
		card: "summary_large_image"
	}
}

/**
 * Defines the configuration for PWA webmanifest.
 */
export const manifest: Partial<ManifestOptions> = {
	name: "LEIA", // Change this to your website's name.
	short_name: "LEIA", // Change this to your website's short name.
	description: DESCRIPTION,
	theme_color: "#ff0000", // Change this to your primary color.
	background_color: "#000000", // Change this to your background color.
	display: "minimal-ui",
	icons: [
		{
			src: "public/favicons/favicon-192x192.png",
			sizes: "192x192",
			type: "image/png"
		},
		{
			src: "/favicons/favicon-512x512.png",
			sizes: "512x512",
			type: "image/png"
		},
		{
			src: "/favicons/favicon-512x512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "any maskable"
		}
	]
}
