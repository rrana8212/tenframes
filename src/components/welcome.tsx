import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";

export function Welcome() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted">Grok darkroom</p>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-fg">
          One photograph. Ten different pictures.
        </h1>
        <p className="max-w-prose text-base text-muted">
          Sign in with the same account you use for Grok. Then choose any photo from your gallery.
          Ten Frames keeps who or what is in it, and makes ten separate full-frame photographs — not
          a collage.
        </p>
      </div>

      <div className="relative mx-auto h-56 w-44" aria-hidden="true">
        <div className="absolute top-8 left-0 h-44 w-32 rounded-md border border-line bg-surface" />
        <div className="absolute top-4 left-4 h-44 w-32 rounded-md border border-line bg-surface-2" />
        <div className="absolute top-0 left-8 h-44 w-32 rounded-md border border-paper bg-bg" />
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted">
          Opened from Grok, you are already signed in. Otherwise continue with Google or X.
        </p>
        {GROK_PROVIDERS.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            className="btn-primary"
            onClick={() => {
              void signIn(provider.providerId, { callbackURL: "/" });
            }}
          >
            Continue with {provider.label}
          </button>
        ))}
      </div>
    </div>
  );
}
