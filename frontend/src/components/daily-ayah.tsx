"use client";

import { useSyncExternalStore } from "react";

// Seven short ayat, one for each day of the week (Sunday first).
const ayat = [
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", english: "Indeed, with hardship comes ease.", ref: "Ash-Sharh 94:6" },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", english: "And say: My Lord, increase me in knowledge.", ref: "Ta-Ha 20:114" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", english: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", english: "Whoever relies upon Allah, He is sufficient for him.", ref: "At-Talaq 65:3" },
  { arabic: "وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ", english: "And man will have nothing except what he strives for.", ref: "An-Najm 53:39" },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", english: "Surely, in the remembrance of Allah do hearts find rest.", ref: "Ar-Ra'd 13:28" },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", english: "Allah does not burden a soul beyond what it can bear.", ref: "Al-Baqarah 2:286" },
];

// Weekday in Pakistan time, so everyone sees the same ayah on the same day.
function todayIndex() {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Karachi" }).format(new Date());
  return Math.max(0, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day));
}

const subscribe = () => () => {};

export function DailyAyah() {
  // -1 on the server; the real day is picked in the browser so a static page never shows a stale ayah.
  const index = useSyncExternalStore(subscribe, todayIndex, () => -1);
  const ayah = index >= 0 ? ayat[index] : null;

  return (
    <figure className="min-h-[3.25rem] text-center" aria-live="polite">
      {ayah && (
        <>
          {/* Amiri gives the ayah a proper Naskh look; falls back to the device's Arabic font. */}
          {/* App Router hoists this link into <head>, so the pages/_document rule does not apply. */}
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&display=swap"
            precedence="default"
          />
          <blockquote
            lang="ar"
            dir="rtl"
            className="font-[Amiri,'Noto_Naskh_Arabic','Traditional_Arabic',serif] text-xl font-bold sm:text-2xl leading-snug text-[#082d63]"
          >
            {ayah.arabic}
          </blockquote>
          <figcaption className="mt-0.5 text-[11px] font-semibold text-[#58718c]">
            {ayah.english} <span className="font-black text-[#be850b]">· {ayah.ref}</span>
          </figcaption>
        </>
      )}
    </figure>
  );
}
