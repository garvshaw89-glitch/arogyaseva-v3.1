import React, { useState, useEffect } from "react";
import { FollowUpQuestion, SupportedLanguage, PatientCase } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { getDefaultFollowUpQuestions } from "../../utils/clinicalRules";
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Stethoscope,
  Info,
  RefreshCw
} from "lucide-react";

interface IntelligentFollowupProps {
  patientData: Partial<PatientCase>;
  answers: Record<string, string>;
  onAnswerChange: (question: string, answer: string) => void;
  onBack: () => void;
  onProceedToAssessment: () => void;
  language: SupportedLanguage;
  isOffline: boolean;
}

export const IntelligentFollowup: React.FC<IntelligentFollowupProps> = ({
  patientData,
  answers,
  onAnswerChange,
  onBack,
  onProceedToAssessment,
  language,
  isOffline,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [patientData.symptoms, patientData.isPregnant]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      if (isOffline) {
        const localQs = getDefaultFollowUpQuestions(patientData);
        setQuestions(localQs);
      } else {
        const res = await fetch("/api/generate-followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: patientData.age,
            gender: patientData.gender,
            symptoms: patientData.symptoms,
            vitals: patientData.vitals,
            isPregnant: patientData.isPregnant,
            currentAnswers: answers,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        } else {
          setQuestions(getDefaultFollowUpQuestions(patientData));
        }
      }
    } catch {
      setQuestions(getDefaultFollowUpQuestions(patientData));
    } finally {
      setIsLoading(false);
    }
  };

  const primaryQuestion = questions[0];

  return (
    <div id="intelligent-followup-step" className="space-y-6">
      {/* Featured Primary Follow-up Banner (Professional Polish Signature) */}
      {primaryQuestion && (
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-300 rounded-full animate-ping"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  {primaryQuestion.category || "INTELLIGENT CLINICAL FOLLOW-UP"}
                </h3>
              </div>
              <span className="text-[10px] bg-blue-500/40 text-blue-100 px-2 py-0.5 rounded-md font-semibold border border-blue-400/40">
                WHO IMCI Trigger
              </span>
            </div>

            <p className="text-xl sm:text-2xl font-medium leading-tight mb-2">
              {primaryQuestion.question}
            </p>

            {primaryQuestion.hindiTranslation && language !== "en" && (
              <p className="text-sm text-blue-100 mb-6 font-medium italic">
                "{primaryQuestion.hindiTranslation}"
              </p>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              {primaryQuestion.options.map((opt) => {
                const isSelected = answers[primaryQuestion.question] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onAnswerChange(primaryQuestion.question, opt)}
                    className={`px-7 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      isSelected
                        ? "bg-white text-blue-700 shadow-lg ring-2 ring-blue-300"
                        : "bg-blue-500/40 text-white border border-blue-400/50 hover:bg-blue-500/60"
                    }`}
                  >
                    {isSelected ? `✓ ${opt}` : opt}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/30 rounded-full blur-2xl"></div>
        </div>
      )}

      {/* Secondary Questions Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {t.intelligentFollowUp}
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  {isOffline ? "WHO ETAT Rules Engine" : "Adaptive Clinical AI"}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Frontline danger sign triage tailored to recorded symptoms & vital measurements
              </p>
            </div>
          </div>

          <button
            onClick={fetchQuestions}
            disabled={isLoading}
            className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-all"
            title="Refresh clinical questions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Re-evaluate</span>
          </button>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-semibold">{t.evaluatingDangerSigns}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.slice(1).map((q, idx) => {
              const currentSelected = answers[q.question];
              const isDangerTriggered =
                currentSelected &&
                q.dangerSignAnswer &&
                (currentSelected.toLowerCase().includes("yes") ||
                  currentSelected.toLowerCase() === q.dangerSignAnswer.toLowerCase());

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isDangerTriggered
                      ? "bg-red-50/90 border-red-300 ring-2 ring-red-500/20"
                      : currentSelected
                      ? "bg-blue-50/40 border-blue-300"
                      : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Question {idx + 2} • {q.category || "CLINICAL EVALUATION"}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                      {q.hindiTranslation && language !== "en" && (
                        <p className="text-xs text-slate-600 mt-1 font-medium italic">
                          {q.hindiTranslation}
                        </p>
                      )}
                    </div>

                    {isDangerTriggered && (
                      <span className="shrink-0 text-[10px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>DANGER SIGN</span>
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {q.options.map((opt) => {
                      const isOptionSelected = currentSelected === opt;
                      const isDangerOption =
                        q.dangerSignAnswer && opt.toLowerCase().includes("yes");

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => onAnswerChange(q.question, opt)}
                          className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                            isOptionSelected
                              ? isDangerOption
                                ? "bg-red-600 text-white border-red-700 shadow-sm"
                                : "bg-blue-600 text-white border-blue-700 shadow-sm"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {isOptionSelected && "✓ "}
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {q.vitalCheckPrompt && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{q.vitalCheckPrompt}</span>
                    </div>
                  )}

                  {isDangerTriggered && q.dangerSignDescription && (
                    <div className="mt-2 text-xs text-red-800 font-semibold bg-red-100/70 p-2.5 rounded-lg border border-red-200">
                      🚨 Clinical Alert: {q.dangerSignDescription}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="btn-back-to-vitals"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Vitals</span>
        </button>

        <button
          id="btn-proceed-to-assessment"
          onClick={onProceedToAssessment}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition-all hover:gap-3"
        >
          <span>Calculate Clinical Urgency</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
