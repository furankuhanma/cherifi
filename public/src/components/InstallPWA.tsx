import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    if (standalone) {
      console.log("✅ App is already installed");
      return;
    }

    // For iOS, show custom instructions
    if (iOS) {
      const dismissed = localStorage.getItem("pwa-ios-install-dismissed");
      if (!dismissed) {
        setTimeout(() => {
          setShowInstallButton(true);
          setShowBanner(true);
        }, 3000);
      }
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed =
        (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowInstallButton(true);

      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log("✅ PWA was installed");
      setShowInstallButton(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-install-dismissed");
      localStorage.removeItem("pwa-ios-install-dismissed");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // iOS: Show instructions modal
    if (isIOS) {
      setShowBanner(true);
      return;
    }

    // Android/Desktop: Use native prompt
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    setDeferredPrompt(null);
    setShowInstallButton(false);
    setShowBanner(false);
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    const key = isIOS ? "pwa-ios-install-dismissed" : "pwa-install-dismissed";
    localStorage.setItem(key, new Date().toISOString());
  };

  if (!showInstallButton || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <img
                    src="/icons/icon-96x96.png"
                    alt="CheriFI"
                    className="w-10 h-10"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base">
                    Install CheriFI App
                  </h3>
                  {isIOS ? (
                    <p className="text-xs md:text-sm text-white/90">
                      Tap <Share size={14} className="inline" /> then "Add to
                      Home Screen"
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm text-white/90 truncate">
                      Get the full experience with offline playback
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!isIOS && (
                  <button
                    onClick={handleInstallClick}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Install</span>
                  </button>
                )}
                <button
                  onClick={handleDismissBanner}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* iOS Instructions (shown when banner is visible on iOS) */}
            {isIOS && showBanner && (
              <div className="mt-3 pt-3 border-t border-white/20 text-sm">
                <p className="font-medium mb-2">How to install:</p>
                <ol className="space-y-1 text-xs text-white/90">
                  <li>
                    1. Tap the <Share size={12} className="inline" /> Share
                    button below
                  </li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" in the top right</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Install Button (when banner is dismissed) */}
      {!showBanner && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
          aria-label="Install App"
        >
          {isIOS ? (
            <Share size={20} className="group-hover:animate-bounce" />
          ) : (
            <Download size={20} className="group-hover:animate-bounce" />
          )}
          <span className="hidden md:inline font-medium">
            {isIOS ? "How to Install" : "Install App"}
          </span>
        </button>
      )}
    </>
  );
};

export default InstallPWA;
