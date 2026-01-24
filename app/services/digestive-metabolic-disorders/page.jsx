"use client";
import ServicePageTemplate from "../components/ServicePageTemplate";

export default function DigestiveMetabolicPage() {
  return (
    <ServicePageTemplate
      title="Digestive & Metabolic Disorders"
      gradientFrom="from-amber-500"
      gradientTo="to-orange-600"
      understanding={[
        "Digestive complaints such as gastritis, acidity, bloating, constipation, irritable bowel symptoms, food intolerance, and metabolic imbalance are among the most common reasons patients seek long-term care.",
        "Many individuals experience temporary relief with repeated medications, dietary changes, or symptom-specific treatments—only to face recurrence once treatment stops. This often happens when individual susceptibility, lifestyle factors, stress, and digestive regulation are not adequately addressed together.",
      ]}
      approach={{
        title: "How Homoeopathy Approaches Digestive Health",
        intro:
          "At AWHCC, digestive disorders are approached through individualised case analysis, not fixed protocols. During consultation, attention is given to:",
        conclusion:
          "Based on this comprehensive assessment, homoeopathic medicines are selected to support digestive regulation, reduce recurrence, and improve overall metabolic balance over time.",
      }}
      assessmentPoints={[
        "Nature, timing, and triggers of digestive symptoms",
        "Appetite, thirst, food preferences, and intolerances",
        "Bowel habits and associated discomfort",
        "Stress levels, sleep quality, and emotional factors",
        "Past illnesses, medications, and investigation reports",
      ]}
      treatmentFocus="The goal is not immediate suppression, but sustainable functional improvement."
      conditions={[
        "Gastritis and chronic acidity",
        "Bloating, gas, and indigestion",
        "Constipation or irregular bowel habits",
        "Irritable bowel–type symptoms",
        "Digestive complaints linked with stress or lifestyle imbalance",
      ]}
      suitableFor={[
        "Have long-standing or recurrent digestive complaints",
        "Experience symptoms aggravated by stress, food, or routine changes",
        "Prefer a personalised, holistic medical approach",
        "Are looking for long-term digestive regulation rather than short-term relief",
      ]}
      notSuitableFor={[
        "Acute abdominal emergencies",
        "Severe conditions requiring immediate surgical or hospital care",
      ]}
      notSuitableNote="In such situations, timely referral or co-management is prioritised."
      expectations={[
        "Detailed first consultation focusing on symptoms and overall health",
        "Review of laboratory reports and prior treatments, if available",
        "Clear explanation of treatment scope, follow-up needs, and realistic timelines",
        "Periodic reassessment and medicine adjustment based on response",
      ]}
      importantNote="Digestive and metabolic concerns often require patience, consistency, and follow-up. Response varies from person to person, and improvement is typically gradual. No instant or guaranteed outcomes are promised—ethical, transparent care is central to our practice."
      ctaDescription="If you are seeking a structured, patient-centred approach to digestive health:"
      ctaButtonText="Book a Digestive Health Consultation"
    />
  );
}
