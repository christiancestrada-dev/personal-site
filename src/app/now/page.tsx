"use client";

import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { MasonryGallery, type GalleryItem } from "@/components/ui/masonry-gallery";

const NOW_ITEMS = [
  {
    text: "Lawning - a colloquial verb used to describe the act of relaxing, socializing, or studying on Andover's central outdoor spaces—specifically the Great Lawn—during warm spring days.",
    photo: "/now/photo-7.jpg",
    alt: "Lawning",
  },
  {
    text: "Currently at school!",
    photo: "/now/photo-8.jpg",
    alt: "Andover campus at sunset",
  },
  {
    text: "Optimizing my computer wallpaper (yes, my computer wallpaper) — coded a Tetris AI that finds the best possible move, a binary clock, sand timer, pomodoro timer, notes, and a planner that auto-syncs to my calendar and classes whenever I get an email. The AI also tracks my activity to improve as I study longer. Plus aesthetic wallpapers to tie it all together.",
    photo: "/now/photo-desktop.jpg",
    alt: "My desktop",
  },
];

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "steiner",
    src: "/now/photo-1.jpg",
    caption: "Josh Steiner, senior advisor at Bloomberg, and former chief of staff of the US treasury",
  },
  {
    id: "hernandez",
    src: "/now/photo-2.jpg",
    caption: "Jose Hernandez, astronaut",
  },
  {
    id: "winter",
    src: "/now/photo-3.jpg",
    caption: "Dr Chris Winter, sleep specialist and podcaster",
  },
  {
    id: "papers-1",
    src: "/now/photo-4.jpg",
    caption: "Papers (my research club)",
  },
  {
    id: "papers-2",
    src: "/now/photo-5.jpg",
    caption: "Papers (my research club)",
  },
  {
    id: "papers-3",
    src: "/now/photo-6.jpg",
    caption: "Papers (my research club)",
  },
  {
    id: "sister",
    src: "/now/photo-sister.jpg",
    caption: "My sister and I",
  },
  {
    id: "dad",
    src: "/now/photo-dad.jpg",
    caption: "Dad!",
  },
  {
    id: "golf",
    src: "/now/golf.mp4",
    caption: "Golfing in the dorm's frontyard",
    type: "video",
  },
  {
    id: "snow",
    src: "/now/photo-snow.jpg",
    caption: "Winter snowstorm activities. Did have to shovel a foot and a half of snow in the morning...",
  },
  {
    id: "twice",
    src: "/now/photo-twice.jpg",
    caption: "Sidequesting: TWICE kpop concert at TD Garden (got free tickets)",
  },
  {
    id: "kasparov",
    src: "/now/photo-kasparov.jpg",
    caption: "Garry Kasparov, Chess world champion 1984-2005, and political activist",
  },
  {
    id: "valentines",
    src: "/now/valentines.mp4",
    caption: "Valentines day performance",
    type: "video" as const,
  },
  {
    id: "eclipse",
    src: "/now/photo-eclipse.jpg",
    caption: "Tracking the solar eclipse",
  },
  {
    id: "spring-performance",
    src: "/now/spring-performance.mp4",
    caption: "Spring performance",
    type: "video" as const,
  },
  {
    id: "movein",
    src: "/now/photo-movein.jpg",
    caption: "Move in",
  },
  {
    id: "olympics",
    src: "/now/photo-olympics.jpg",
    caption: "Rainy day cluster olympics",
  },
  {
    id: "sleepover",
    src: "/now/photo-sleepover.jpg",
    caption: "Me sleeping over at my friend's dorm (slept on the inflatable couch for three weeks)",
  },
  {
    id: "chicago",
    src: "/now/photo-chicago.jpg",
    caption: "Chicago dying the river green St. Patrick's Day",
  },
  {
    id: "sleeping",
    src: "/now/photo-sleeping.jpg",
    caption: "Me sleeping!",
  },
  {
    id: "greencup",
    src: "/now/photo-greencup.jpg",
    caption: "Painting the green cup for the green cup challenge",
  },
  {
    id: "pennstation",
    src: "/now/photo-pennstation.jpg",
    caption: "Penn Med Station",
  },
  {
    id: "knoll",
    src: "/now/knoll.mp4",
    caption: "Night on the knoll performance",
    type: "video" as const,
  },
  {
    id: "cooking",
    src: "/now/photo-cooking.jpg",
    caption: "Cooking (quite badly) Bolivian Silpancho",
  },
  {
    id: "church",
    src: "/now/photo-church.jpg",
    caption: "My church before adding drums to mass",
  },
  {
    id: "gravy",
    src: "/now/photo-gravy.jpg",
    caption: "Gravy, one of my students",
  },
  {
    id: "reading-station",
    src: "/now/photo-reading-station.jpg",
    caption: "Reading station, quick snack before going back to the lab",
  },
  {
    id: "matriculation",
    src: "/now/photo-matriculation.jpg",
    caption: "My sister's matriculation to high school!",
  },
  {
    id: "campfire",
    src: "/now/photo-campfire.jpg",
    caption: "Fall campfire with the dorm",
  },
  {
    id: "asm",
    src: "/now/photo-asm.jpg",
    caption: "Speaking in front of the school about the importance of sleep at All School Meeting",
  },
  {
    id: "snowstorm-walk",
    src: "/now/snowstorm-walk.mp4",
    caption: "Snowstorm had me walking backwards",
    type: "video" as const,
  },
];

export default function NowPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--site-bg)", color: "var(--site-text)" }}>
      <main className="mx-auto max-w-3xl px-6 py-24 space-y-24">
        <PageHeader title="Now" subtitle="What I'm up to this week" />

        {/* Now items with photos */}
        <div className="space-y-16">
          {NOW_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 items-center`}
            >
              <div className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "var(--site-text-prose)" }}>
                  {item.text}
                </p>
              </div>
              <div className="w-full md:w-64 shrink-0">
                <div className="overflow-hidden rounded-lg">
                  <Image
                    src={item.photo}
                    alt={item.alt}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Photo Gallery — full width */}
      <section className="w-full px-12 pb-24 space-y-8">
        <h2 className="text-lg font-medium text-center" style={{ color: "var(--site-text-bright)" }}>
          Photo Gallery
        </h2>
        <MasonryGallery images={GALLERY_ITEMS} columns={3} gap={4} />
      </section>
    </div>
  );
}
