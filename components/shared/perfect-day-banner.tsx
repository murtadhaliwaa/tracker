"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";

export function PerfectDayBanner({ show }: { show: boolean }) {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-lg items-center justify-center gap-2 rounded-xl border border-rpg-gold/40 bg-rpg-gold/10 px-4 py-3 text-sm font-bold text-rpg-gold shadow-rpgGold animate-[rpg-fade-in_250ms_ease-out_both]">
      <Flame className="size-5" />
      {t("perfectDayBanner")}
    </div>
  );
}
