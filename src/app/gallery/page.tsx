import OutfitGalleryClient from "@/components/outfit-gallery-client";
import Header from "@/components/header";

export default function GalleryPage() {
  return (
    <div className="flex h-screen w-full flex-col bg-background font-body">
      <Header />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Saved Outfits</h1>
            <OutfitGalleryClient />
        </div>
      </main>
    </div>
  );
}
