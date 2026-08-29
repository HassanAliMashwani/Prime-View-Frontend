import { HeroSection } from "@/components/sections/HeroSection";
import { ReferenceAboutView } from "@/components/about/ReferenceAboutView";
import { AmenitiesSection } from "@/components/sections/AmenitiesSection";
import { LocationDistancesSection } from "@/components/sections/LocationDistancesSection";
import { MapSection } from "@/components/sections/MapSection";
import { ContactSection } from "@/components/sections/ContactSection";


export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <ReferenceAboutView />

      <AmenitiesSection />
      <LocationDistancesSection />
      <MapSection />
      <ContactSection />
    </div>
  );
}
