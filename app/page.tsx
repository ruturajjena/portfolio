import { Hero } from "@/components/hero/Hero";
import { Positioning } from "@/components/positioning/Positioning";
import { DataSection } from "@/components/data-engineering/DataSection";
import { DataSkills } from "@/components/data-engineering/DataSkills";
import { Builds } from "@/components/builds/Builds";
import { Macrova } from "@/components/macrova/Macrova";
import { DesignSection } from "@/components/web-design/DesignSection";
import { BrandMotion } from "@/components/brand-motion/BrandMotion";
import { About } from "@/components/about/About";
import { Contact } from "@/components/contact/Contact";

export default function Page() {
  return (
    <main id="main" className="relative">
      <Hero />
      <Positioning />
      <DataSection />
      <DataSkills />
      <Builds />
      <Macrova />
      <DesignSection />
      <BrandMotion />
      <About />
      <Contact />
    </main>
  );
}
