import type { FormDef } from "@/lib/past-meetings";

type Answer = { value: string; source: string };

/** Answers supplied by the applicant for the demo forms. */
export function applicantAnswers(form: FormDef): Record<string, Answer> {
  const you = (value: string) => ({ value, source: "Your answer" });
  const youOpt = (value: string) => ({ value, source: "Your answer (optional)" });
  const demo = (value: string) => ({ value, source: "Demo answer — review before sending" });

  switch (form.id) {
    case "internship-app":
    case "job-app":
      return {
        location: you("Williamsburg, VA"),
        portfolio: youOpt("No portfolio link"),
        workAuth: you("Yes — authorized to work in the US"),
        sponsorship: you("No"),
        startDate: you("Immediately"),
        consent: { value: "Yes", source: "Your instruction to complete and submit" },
        salary: you("$85,000 – $95,000"),
      };
    case "lab-signup":
      return {
        studentId: demo("9524831"),
        email: demo("sumon.mondal@wm.edu"),
        section: you("Tuesday section"),
        partner: you("No partner preference"),
        notes: demo("Please pair me with any available partner; comfortable with the SEM basics."),
      };
    case "w9":
      return {
        name: you("Helix Supply Co."),
        classification: you("Corporation (C corp)"),
      };
    case "class-form":
      return {
        email: demo("sumon.mondal@wm.edu"),
        summary: demo(
          "SEM scan of Thalassiosira sp. A2 frustule at 25,000×, 10 kV: valve structure fully resolved. Proposed for paper figure 2; A-series rescan funded by the NSF supplement.",
        ),
      };
    default:
      return {};
  }
}

export function completedAnswers<T extends { value: string; source?: string }>(form: FormDef, answers: Record<string, T>): Record<string, Answer> {
  const supplied = applicantAnswers(form);
  return Object.fromEntries(form.fields.map(({ key }) => [key, supplied[key] ?? { value: answers[key]?.value ?? "", source: answers[key]?.source ?? "Needs your input" }]));
}
