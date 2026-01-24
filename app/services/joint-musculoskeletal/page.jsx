"use client";
import ServicePageTemplate from "../components/ServicePageTemplate";

export default function JointMusculoskeletalPage() {
  return (
    <ServicePageTemplate
      title="Joint Pain & Musculoskeletal Disorders"
      gradientFrom="from-blue-500"
      gradientTo="to-indigo-600"
      understanding={[
        "Joint and musculoskeletal complaints such as knee pain, osteoarthritis, chronic back pain, neck stiffness, shoulder pain, and recurrent muscle aches are common across age groups. These conditions often develop due to a combination of degenerative changes, posture, repetitive strain, metabolic factors, weight, past injuries, and lifestyle habits.",
        "While pain-relieving medicines may provide temporary comfort, symptoms frequently recur when the underlying functional imbalance and contributing factors are not addressed.",
      ]}
      approach={{
        title: "How Homoeopathy Approaches Joint & Musculoskeletal Health",
        intro:
          "At AWHCC, musculoskeletal concerns are managed through individualised homoeopathic assessment, not symptom-based protocols. During consultation, attention is given to:",
        conclusion:
          "Based on this comprehensive evaluation, homoeopathic medicines are selected to support pain regulation, reduce stiffness, and improve functional mobility over time.",
      }}
      assessmentPoints={[
        "Location, nature, and pattern of pain or stiffness",
        "Aggravating and relieving factors (movement, rest, weather, posture)",
        "Associated swelling, limitation of movement, or functional difficulty",
        "Past injuries, surgeries, or long-term medication use",
        "General health, metabolism, sleep, and activity levels",
      ]}
      treatmentFocus="The focus is on gradual functional improvement, not instant pain suppression."
      conditions={[
        "Knee pain and early degenerative joint changes",
        "Osteoarthritis (non-emergency cases)",
        "Chronic back, neck, and shoulder pain",
        "Recurrent muscle aches and stiffness",
        "Joint pain associated with lifestyle or metabolic factors",
      ]}
      suitableFor={[
        "Have chronic or recurrent joint or muscle pain",
        "Experience stiffness or pain affecting daily activities",
        "Prefer a personalised, non-invasive approach",
        "Are willing to follow a monitored, longer-term treatment plan",
      ]}
      notSuitableFor={[
        "Acute trauma or fractures",
        "Severe neurological deficits",
        "Conditions requiring urgent surgical or emergency intervention",
      ]}
      notSuitableNote="In such cases, immediate referral or co-management is advised."
      expectations={[
        "Detailed first consultation focusing on pain patterns and general health",
        "Review of investigations (X-rays, scans, blood reports) if available",
        "Clear discussion about treatment scope, limitations, and follow-up needs",
        "Periodic reassessment and medicine adjustment based on response",
      ]}
      importantNote="Musculoskeletal conditions—especially degenerative ones—often require time, consistency, and follow-up. Symptom improvement is usually gradual and varies from person to person. No instant relief or guaranteed outcomes are promised—ethical and transparent care is central to our practice."
      ctaDescription="If you are seeking a structured, patient-centred approach to managing joint or musculoskeletal pain:"
      ctaButtonText="Book a Joint & Pain Consultation"
    />
  );
}
