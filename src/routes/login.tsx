import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Welcome } from "@/components/welcome";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();

  if (!isPending && user) return <Navigate to="/" />;

  return (
    <Shell>
      {isPending ? (
        <p className="text-muted">Checking your Grok account.</p>
      ) : (
        <Welcome />
      )}
    </Shell>
  );
}
