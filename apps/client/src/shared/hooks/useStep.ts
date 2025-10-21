import { useState, useCallback } from 'react';

type UseStepProps = {
  /** The initial step */
  initialStep?: number;
  /** The maximum number of steps */
  maxStep: number;
};

/**
 * A hook to manage multi-step flows.
 * @param {UseStepProps} props - The properties for the hook.
 * @returns An object with the current step and functions to control it.
 */
export const useStep = ({ initialStep = 1, maxStep }: UseStepProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const canGoToNextStep = currentStep < maxStep;
  const canGoToPrevStep = currentStep > 1;

  const goToNextStep = useCallback(() => {
    if (canGoToNextStep) {
      setCurrentStep((step) => step + 1);
    }
  }, [canGoToNextStep]);

  const goToPrevStep = useCallback(() => {
    if (canGoToPrevStep) {
      setCurrentStep((step) => step - 1);
    }
  }, [canGoToPrevStep]);

  const setStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= maxStep) {
        setCurrentStep(step);
      }
    },
    [maxStep],
  );

  return {
    currentStep,
    setStep,
    goToNextStep,
    goToPrevStep,
    canGoToNextStep,
    canGoToPrevStep,
  };
};
