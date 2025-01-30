import React, { useState } from 'react';
// import './FinalAssessment.css';

const FinalAssessment = () => {
  const [assessment, setAssessment] = useState({
    incidentDescription: '',
    damageAssessment: '',
    responsibleParty: '',
    riskEvaluation: '',
    recoveryActions: '',
    finalRecommendation: ''
  });

  const handleChange = (e) => {
    setAssessment({
      ...assessment,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Final Assessment Submitted:', assessment);
    // Here, you would typically send the data to your backend API
  };

  return (
    <div className="assessment-container">
      <form onSubmit={handleSubmit} className="assessment-form">
        {/* Incident Description */}
        <div className="form-group">
          <label htmlFor="incidentDescription">Incident Description:</label>
          <textarea
            id="incidentDescription"
            name="incidentDescription"
            value={assessment.incidentDescription}
            onChange={handleChange}
            placeholder="Describe the cyber incident"
            rows="4"
            required
          />
        </div>

        {/* Damage Assessment */}
        <div className="form-group">
          <label htmlFor="damageAssessment">Damage Assessment:</label>
          <textarea
            id="damageAssessment"
            name="damageAssessment"
            value={assessment.damageAssessment}
            onChange={handleChange}
            placeholder="Assess the extent of the damage"
            rows="4"
            required
          />
        </div>

        {/* Responsible Party */}
        <div className="form-group">
          <label htmlFor="responsibleParty">Responsible Party:</label>
          <input
            type="text"
            id="responsibleParty"
            name="responsibleParty"
            value={assessment.responsibleParty}
            onChange={handleChange}
            placeholder="Who is responsible for the incident?"
            required
          />
        </div>

        {/* Risk Evaluation */}
        <div className="form-group">
          <label htmlFor="riskEvaluation">Risk Evaluation:</label>
          <textarea
            id="riskEvaluation"
            name="riskEvaluation"
            value={assessment.riskEvaluation}
            onChange={handleChange}
            placeholder="Evaluate the risks involved"
            rows="4"
            required
          />
        </div>

        {/* Recovery Actions */}
        <div className="form-group">
          <label htmlFor="recoveryActions">Recovery Actions:</label>
          <textarea
            id="recoveryActions"
            name="recoveryActions"
            value={assessment.recoveryActions}
            onChange={handleChange}
            placeholder="List the actions taken for recovery"
            rows="4"
            required
          />
        </div>

        {/* Final Recommendation */}
        <div className="form-group">
          <label htmlFor="finalRecommendation">Final Recommendation:</label>
          <textarea
            id="finalRecommendation"
            name="finalRecommendation"
            value={assessment.finalRecommendation}
            onChange={handleChange}
            placeholder="Provide your final recommendation"
            rows="4"
            required
          />
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-button">
          Submit Final Assessment
        </button>
      </form>
    </div>
  );
};

export default FinalAssessment;
