"use client";
import ServicePageTemplate from "../components/ServicePageTemplate";

export default function WomensHealthPage() {
  return (
    <ServicePageTemplate
      title="Women's Health Concerns"
      gradientFrom="from-pink-500"
      gradientTo="to-rose-600"
      understanding={[
        "Women commonly consult for concerns such as PCOS, menstrual irregularities, painful or heavy periods, PMS, hormonal imbalance, and menopausal symptoms. These issues often involve a complex interaction of hormonal regulation, metabolism, stress, sleep, lifestyle, and emotional health.",
        "While short-term treatments may offer relief, recurrence is common when the underlying regulatory imbalance is not addressed comprehensively.",
      ]}
      approach={{
        title: "How Homoeopathy Approaches Women's Health",
        intro:
          "At AWHCC, women's health concerns are approached through individualised case-taking, not fixed disease protocols. During consultation, we assess:",
        conclusion:
          "Based on this holistic assessment, homoeopathic medicines are selected to support hormonal regulation, improve cycle regularity, and reduce symptom recurrence over time.",
      }}
      assessmentPoints={[
        "Menstrual history (cycle pattern, flow, pain, associated symptoms)",
        "Hormonal reports and prior treatments, if available",
        "Metabolic factors (weight changes, appetite, energy levels)",
        "Stress, sleep, and emotional well-being",
        "Reproductive history and overall medical background",
      ]}
      treatmentFocus="Care is supportive and regulatory, not suppressive or instant."
      conditions={[
        "Polycystic Ovary Syndrome (PCOS)",
        "Irregular, painful, or heavy menstrual cycles",
        "Premenstrual symptoms (PMS)",
        "Menopausal complaints (hot flashes, mood changes, sleep issues)",
        "Hormone-related lifestyle concerns",
      ]}
      suitableFor={[
        "Have recurrent or long-standing menstrual or hormonal concerns",
        "Experience symptoms affecting daily life or emotional well-being",
        "Prefer a personalised, non-protocol-based approach",
        "Are willing to follow a longer-term, monitored treatment plan",
      ]}
      notSuitableFor={[
        "Acute gynaecological emergencies",
        "Conditions requiring immediate surgical or hospital intervention",
      ]}
      notSuitableNote="In such cases, timely referral or co-management with specialists is prioritised."
      expectations={[
        "Detailed first consultation focusing on menstrual, hormonal, and general health",
        "Review of reports, scans, and previous prescriptions (if available)",
        "Clear discussion of treatment scope, follow-ups, and realistic timelines",
        "Periodic reassessment and medicine adjustment based on response",
      ]}
      importantNote="Women's health conditions—especially hormonal concerns—often require time, consistency, and follow-up. Improvement is usually gradual and varies between individuals. No guaranteed or instant outcomes are promised—ethical communication is central to our care."
      ctaDescription="If you are looking for a structured, patient-centred approach to women's health:"
      ctaButtonText="Book a Women's Health Consultation"
    />
  );
}
