import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const middleware = createMiddleware(routing);

export default middleware;

export const config = {
  matcher: [
    "/",
    "/(en|ur|ar|hi|bn|es|fr|de|pt|zh|ja|ko|tr|it|id|vi|ru)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
