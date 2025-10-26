import { Feed } from "@/components/Feed";

export default async function Home()  {
  // {params}: {params: Promise<{lang: 'en' | 'fr' }>}
  return (
    <div className="md:my-8 md:mx-12">
      <Feed />
    </div>
  );
}
