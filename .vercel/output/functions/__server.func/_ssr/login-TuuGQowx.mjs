import { x as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Welcome, r as useCurrentUserState, t as Shell } from "./welcome-DT8GKKvA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-TuuGQowx.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Checking your Grok account."
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Welcome, {}) });
}
//#endregion
export { Login as component };
