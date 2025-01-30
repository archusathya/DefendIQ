// StepIndicator.js
import React from 'react';
import './StepIndicator.css';

const StepIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="step-indicator">
      <div className="step-text">
        Step {currentStep} of {totalSteps}
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StepIndicator;
