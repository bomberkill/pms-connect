import { Feed } from "@/components/Feed";

export default async function Home() {
  // {params}: {params: Promise<{lang: 'en' | 'fr' }>}
  return (
    <div className="w-full max-w-[680px] mx-auto px-4 pt-3 md:my-6 md:px-0">
      <Feed />
    </div>
  );
}
