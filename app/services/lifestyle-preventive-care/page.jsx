"use client";
import ServicePageTemplate from "../components/ServicePageTemplate";

export default function LifestylePreventiveCarePage() {
  return (
    <ServicePageTemplate
      title="Lifestyle & Preventive Care"
      subtitle="Individualised Homoeopathic Support for Long-Term Well-Being"
      gradientFrom="from-green-500"
      gradientTo="to-emerald-600"
      understanding={[
        "Many health concerns develop gradually due to recurrent stress, irregular routines, poor sleep, dietary imbalance, sedentary habits, and unresolved minor illnesses. Over time, these factors may contribute to frequent infections, fatigue, digestive issues, skin problems, hormonal imbalance, or reduced overall well-being.",
        "Preventive care focuses on early regulation and long-term balance, rather than waiting for disease to progress or recur repeatedly.",
      ]}
      approach={{
        title: "How Preventive Care Is Approached at AWHCC",
        intro:
          "At AWHCC, lifestyle and preventive care is not a generic wellness program. It is individualised medical support, based on thorough homoeopathic case-taking. During consultation, we evaluate:",
        conclusion:
          "Homoeopathic medicines are selected to support natural regulatory mechanisms, improve resilience, and reduce the tendency toward recurrent illness.",
      }}
      assessmentPoints={[
        "Current health concerns and recurring patterns",
        "Daily routine, sleep quality, stress levels, and work habits",
        "Diet, digestion, appetite, and energy levels",
        "Past illnesses, medications, and family history",
        "Individual susceptibility and constitutional tendencies",
      ]}
      treatmentFocus="The goal is sustainable health regulation, not quick 'boosts' or commercial wellness claims."
      conditions={[
        "Frequent minor illnesses or recurring symptoms",
        "Persistent fatigue or reduced vitality despite normal reports",
        "Health concerns before they become chronic",
        "Long-term well-being goals",
        "Recurrent infections or low immunity patterns",
      ]}
      suitableFor={[
        "Experience frequent minor illnesses or recurring symptoms",
        "Feel persistent fatigue or reduced vitality despite normal reports",
        "Want to address health concerns before they become chronic",
        "Prefer a structured, personalised preventive approach",
        "Are looking for long-term well-being, not symptom-by-symptom treatment",
      ]}
      notSuitableFor={[
        "Acute medical emergencies",
        "Conditions requiring immediate diagnostic or hospital-based intervention",
      ]}
      notSuitableNote="Appropriate referrals are advised when necessary."
      expectations={[
        "Comprehensive first consultation covering physical, mental, and lifestyle factors",
        "Review of reports or previous treatments, if available",
        "Clear discussion about preventive goals, follow-ups, and realistic expectations",
        "Periodic reassessment and individualised adjustments over time",
      ]}
      importantNote="Preventive and lifestyle-focused care works best with consistency and follow-up. Benefits develop gradually and vary between individuals. No guaranteed outcomes are promised—ethical and transparent communication is part of our practice."
      ctaDescription="If you are looking to invest in long-term health regulation and prevention:"
      ctaButtonText="Book a Preventive Care Consultation"
    />
  );
}
