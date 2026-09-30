import type { ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { InstallBar } from "@/components/install-bar";

export function Shell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-5 py-4">
          <a href="/" className="font-display text-2xl leading-none tracking-tight text-fg">
            Ten Frames
          </a>
          <div className="identity-slot flex min-h-8 items-center">
            {isPending ? <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" /> : null}
            {user ? <UserButton /> : null}
          </div>
        </div>
      </header>
      <InstallBar />
      <main className="mx-auto w-full max-w-lg px-5 pt-8 pb-16">{children}</main>
    </div>
  );
}
