import React from 'react';
import { TestSuite } from '@/types';

export interface StepperProps {
  testSuites: TestSuite[];
  currentTestSuite: string;
  onStepClick: (stepId: string) => void;
}

export interface StepProps {
  step: TestSuite;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick?: () => void;
  isLast: boolean;
}

function Step({ step, isActive, isCompleted, isClickable, onClick, isLast }: StepProps) {
  const getStepIcon = () => {
    if (isCompleted && step.notError) {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      );
    } else if (isCompleted && !step.notError) {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      );
    } else {
      return <span className="text-sm font-medium">{parseInt(step.id) + 1}</span>;
    }
  };

  const getStepStyles = () => {
    if (isCompleted && step.notError) {
      return 'bg-green-600 text-white border-green-600';
    } else if (isCompleted && !step.notError) {
      return 'bg-red-600 text-white border-red-600';
    } else if (isActive) {
      return 'bg-blue-600 text-white border-blue-600';
    } else {
      return 'bg-gray-200 text-gray-600 border-gray-300';
    }
  };

  const getConnectorStyles = () => {
    if (isCompleted) {
      return step.notError ? 'bg-green-600' : 'bg-red-600';
    } else {
      return 'bg-gray-300';
    }
  };

  const stepClasses = `
    flex items-center justify-center w-10 h-10 border-2 rounded-full transition-all duration-200
    ${getStepStyles()}
    ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
  `;

  const labelClasses = `
    mt-2 text-sm font-medium text-center max-w-32
    ${isActive ? 'text-blue-600' : ''}
    ${isCompleted ? (step.notError ? 'text-green-600' : 'text-red-600') : 'text-gray-600'}
  `;

  return (
    <div className="flex flex-col items-center relative">
      <button
        className={stepClasses}
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        aria-label={`Step ${parseInt(step.id) + 1}: ${step.label}`}
      >
        {getStepIcon()}
      </button>
      
      <div className={labelClasses}>
        {step.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </div>

      {!isLast && (
        <div 
          className={`absolute top-5 left-10 w-20 h-0.5 transition-colors duration-200 ${getConnectorStyles()}`}
          style={{ zIndex: -1 }}
        />
      )}
    </div>
  );
}

export function Stepper({ testSuites, currentTestSuite, onStepClick }: StepperProps) {
  const currentStepIndex = parseInt(currentTestSuite);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between px-4 py-8">
        {testSuites.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex || !!step.complete;
          const isClickable = !!onStepClick && (isCompleted || isActive);
          const isLast = index === testSuites.length - 1;

          return (
            <Step
              key={step.id}
              step={step}
              isActive={isActive}
              isCompleted={isCompleted}
              isClickable={isClickable}
              isLast={isLast}
              onClick={() => onStepClick(step.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export interface StepContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContent({ children, className = '' }: StepContentProps) {
  return (
    <div className={`bg-gray-50 min-h-96 p-6 ${className}`}>
      {children}
    </div>
  );
}

export default Stepper;