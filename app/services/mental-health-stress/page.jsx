"use client";
import ServicePageTemplate from "../components/ServicePageTemplate";

export default function MentalHealthStressPage() {
  return (
    <ServicePageTemplate
      title="Mental Health & Stress-Related Concerns"
      subtitle="Integrated Homoeopathic & Psychological Care"
      gradientFrom="from-violet-500"
      gradientTo="to-purple-600"
      understanding={[
        "Concerns such as chronic stress, anxiety, emotional exhaustion, sleep disturbances, irritability, low mood, and psychosomatic complaints are increasingly common. These issues often arise from a combination of mental strain, lifestyle imbalance, emotional factors, sleep disruption, and physical health stressors.",
        "Many individuals experience temporary relief with short-term measures, but symptoms may recur when the underlying emotional and regulatory imbalance is not addressed in a structured manner.",
      ]}
      approach={{
        title: "How Care Is Approached at AWHCC",
        intro:
          "At AWHCC, mental health concerns are addressed through an integrated, individualised approach, combining homoeopathic consultation with professional psychological support when indicated. During assessment, we consider:",
        conclusion:
          "Homoeopathic treatment focuses on supporting emotional regulation and stress response, while psychology sessions provide evidence-based counselling and coping strategies, when appropriate.",
      }}
      assessmentPoints={[
        "Nature, duration, and triggers of emotional or mental distress",
        "Sleep patterns, energy levels, and daily functioning",
        "Stressors related to work, family, or health",
        "Physical symptoms linked to emotional strain (headache, gut issues, fatigue)",
        "Past treatments, medications, and coping strategies",
      ]}
      treatmentFocus="Care is supportive, structured, and non-judgemental, not suppressive or rushed."
      conditions={[
        "Stress-related complaints and burnout",
        "Anxiety symptoms and excessive worry",
        "Sleep disturbances and poor sleep quality",
        "Mood fluctuations affecting daily life",
        "Psychosomatic symptoms linked to stress",
      ]}
      suitableFor={[
        "Experience persistent stress, anxiety, or emotional strain",
        "Have sleep or concentration issues affecting daily functioning",
        "Prefer a holistic yet medically responsible approach",
        "Are open to a combined homoeopathy and psychology model, when needed",
      ]}
      notSuitableFor={[
        "Psychiatric emergencies",
        "Severe mental health conditions requiring immediate hospitalisation or specialised psychiatric care",
      ]}
      notSuitableNote="In such cases, prompt referral or coordinated care is prioritised in the patient's best interest."
      expectations={[
        "Detailed initial consultation focusing on emotional, mental, and physical health",
        "Confidential discussion in a safe, professional environment",
        "Clear explanation of treatment scope, therapy options, and follow-up plans",
        "Periodic reassessment and coordinated care between doctor and psychologist, when required",
      ]}
      importantNote="Mental health improvement is often gradual and individual-specific. Response depends on multiple factors, including consistency and follow-up. No instant or guaranteed results are promised—ethical, transparent care is central to our practice."
      ctaDescription="If you are looking for structured, compassionate, and professional support for mental well-being:"
      ctaButtonText="Book a Mental Wellness Consultation"
    />
  );
}
