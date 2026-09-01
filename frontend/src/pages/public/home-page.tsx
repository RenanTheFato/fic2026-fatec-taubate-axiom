import { AboutSection } from "../../components/home/about-section"
import { EventsAgenda } from "../../components/home/events-agenda"
import { HeroSection } from "../../components/home/hero-section"
import { ImpactNumbers } from "../../components/home/impact-numbers"
import { LatestNews } from "../../components/home/latest-news"
import { PartnerCta } from "../../components/home/partner-cta"
import { PartnersSection } from "../../components/home/partners-section"

// A ordem das seções é a mesma do site atual de propósito: quem já conhece a
// Somos do Bem precisa continuar se orientando. O que muda é a origem do dado
// e a entrada de Eventos, que a ONG pediu e o site de hoje não tem.
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PartnersSection />
      <AboutSection />
      <ImpactNumbers />
      <EventsAgenda />
      <LatestNews />
      <PartnerCta />
    </>
  )
}
