"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ChecklistQuestion } from "./ChecklistQuestion";
import { RegistrationFormSection } from "./registration-form-section";
import { checklistService } from "@/lib/checklistService";

export function ChecklistFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await checklistService.getQuestions();
        if (response.success) {
          setQuestions(response.data);
        } else {
          setError("Failed to load questions");
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to load questions. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleAnswer = (answer) => {
    const newAnswers = [
      ...answers,
      { question: questions[currentStep].question, answer },
    ];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading questions...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-[600px] flex flex-col items-center justify-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
        STOX Smart Financial Assessment - Step {currentStep + 1} of{" "}
        {questions.length}
      </h2>
      <p className="text-xl text-gray-600 mb-8">
        Discover where you stand today and the best financial path for you this
        title should be on the top of the checklist
      </p>
      <div className="w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isCompleted ? (
            <ChecklistQuestion
              key="question"
              question={questions[currentStep].question}
              options={questions[currentStep].options}
              currentStep={currentStep}
              totalSteps={questions.length}
              onAnswer={handleAnswer}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <RegistrationFormSection checklistAnswers={answers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
