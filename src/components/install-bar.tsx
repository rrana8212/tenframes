import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

export function InstallBar() {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = navigator as Navigator & { standalone?: boolean };
    setStandalone(media.matches || nav.standalone === true);
    setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setReady(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!ready || standalone) return null;

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-lg flex-wrap items-center gap-3 px-5 py-3">
        <Smartphone className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm leading-snug text-muted">
          Install Ten Frames, then choose any photo from your gallery.
        </p>
        {promptEvent ? (
          <button
            type="button"
            className="btn-line shrink-0 px-4"
            onClick={() => {
              void promptEvent.prompt();
            }}
          >
            Install
          </button>
        ) : (
          <button type="button" className="btn-line shrink-0 px-4" onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "How"}
          </button>
        )}
      </div>
      {open ? (
        <p className="mx-auto w-full max-w-lg px-5 pb-4 text-sm leading-snug text-muted">
          {ios
            ? "In Safari, tap Share, then Add to Home Screen. Open Ten Frames from that icon and pick a photograph."
            : "Open the browser menu and choose Install app or Add to Home Screen. Then launch Ten Frames and pick a photograph."}
        </p>
      ) : null}
    </div>
  );
}
