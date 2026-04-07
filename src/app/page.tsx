import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveStream from "@/components/LiveStream";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import CharacterCreator from "@/components/CharacterCreator";
import GettingStarted from "@/components/GettingStarted";
import Stats from "@/components/Stats";
import Platforms from "@/components/Platforms";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CharacterCreator />
        <LiveStream />
        <HowItWorks />
        <Features />
        <GettingStarted />
        <Stats />
        <Platforms />
      </main>
      <Footer />
    </>
  );
}
