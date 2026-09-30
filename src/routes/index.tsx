import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Studio } from "@/components/studio";
import { Welcome } from "@/components/welcome";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();

  return (
    <Shell>
      {isPending ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted">Grok darkroom</p>
          <h1 className="font-display text-4xl leading-tight tracking-tight">
            One photograph. Ten different pictures.
          </h1>
          <p className="text-base text-muted">
            Sign in with the account you use for Grok, choose a gallery photo, and make ten separate full-frame pictures.
          </p>
          <p className="text-sm text-faint">Checking your Grok account.</p>
        </div>
      ) : user ? (
        <Studio />
      ) : (
        <Welcome />
      )}
    </Shell>
  );
}
