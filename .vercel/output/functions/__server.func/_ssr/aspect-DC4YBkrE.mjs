import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/aspect-DC4YBkrE.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-1vAx-gM_.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-Danb5iQ2.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var ASPECT_RATIOS = [
	"1:1",
	"3:4",
	"4:3",
	"9:16",
	"16:9",
	"2:3",
	"3:2",
	"9:19.5",
	"19.5:9",
	"9:20",
	"20:9",
	"1:2",
	"2:1",
	"21:9",
	"5:2"
];
var ASPECT_VALUES = [
	["1:1", 1],
	["4:3", 4 / 3],
	["3:2", 3 / 2],
	["16:9", 16 / 9],
	["2:1", 2],
	["21:9", 21 / 9],
	["5:2", 5 / 2],
	["20:9", 20 / 9],
	["19.5:9", 19.5 / 9],
	["3:4", 3 / 4],
	["2:3", 2 / 3],
	["9:16", 9 / 16],
	["1:2", 1 / 2],
	["9:20", 9 / 20],
	["9:19.5", 9 / 19.5]
];
function isAspectRatio(value) {
	return ASPECT_RATIOS.includes(value);
}
/** Closest supported photographic frame for a source pixel size. */
function nearestAspect(width, height) {
	const ratio = width / Math.max(1, height);
	let best = "3:2";
	let bestDiff = Number.POSITIVE_INFINITY;
	for (const [label, value] of ASPECT_VALUES) {
		const diff = Math.abs(Math.log(ratio) - Math.log(value));
		if (diff < bestDiff) {
			best = label;
			bestDiff = diff;
		}
	}
	return best;
}
function aspectToCss(aspect) {
	const [w, h] = aspect.split(":");
	const width = Number(w);
	const height = Number(h);
	if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) return "3 / 2";
	return `${width} / ${height}`;
}
//#endregion
export { nearestAspect as i, authMiddleware as n, isAspectRatio as r, aspectToCss as t };
