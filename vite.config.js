import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                runtimeCaching: [
                    // GitHub API responses - try network first
                    {
                        urlPattern: /^https:\/\/api\.github\.com\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "github-api-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60, // 1 hour
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    // GitHub raw content - stale while revalidate
                    {
                        urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
                        handler: "StaleWhileRevalidate",
                        options: {
                            cacheName: "github-raw-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    // External images - cache first
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "image-cache",
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    // Picsum placeholder images
                    {
                        urlPattern: /^https:\/\/picsum\.photos\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "picsum-cache",
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: "ItemDeck",
                short_name: "ItemDeck",
                description: "Adaptive Card Grid Application",
                theme_color: "#3b82f6",
                background_color: "#ffffff",
                display: "standalone",
                icons: [
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
