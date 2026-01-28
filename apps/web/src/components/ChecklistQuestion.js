"use client";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';

export function ChecklistQuestion({
    question,
    options,
    currentStep,
    totalSteps,
    onAnswer,
}) {
    const t = useTranslations();
    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                    <span>{t('checklist.question', { current: currentStep + 1, total: totalSteps })}</span>
                    <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl p-6 sm:p-10"
            >
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">
                    {question}
                </h3>

                <div className="space-y-4">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => onAnswer(option)}
                            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 group"
                        >
                            <span className="flex items-center justify-between">
                                <span className="text-lg text-gray-700 group-hover:text-blue-700 font-medium">
                                    {option}
                                </span>
                                <span className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-blue-600 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
