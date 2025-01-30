import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './CloseClaim.css'; // Import the external CSS file

const CloseClaim = () => {
  const { claimNumber } = useParams();
  const [closeReason, setCloseReason] = useState('');
  const [outcome, setOutcome] = useState(''); // State for dropdown selection
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const outcomes = [
    'Claim settled',
    'Claim denied',
    'Fraud suspected',
    'Withdrawn by claimant',
    'Other',
  ]; // List of predefined outcomes

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!closeReason || !outcome) {
      setErrorMessage('Please provide all required fields.');
      return;
    }

    try {
        alert(claimNumber)
      const response = await axios.post('http://localhost:5000/api/close-claim', {
        claimNumber,
        closeReason,
        outcome,
      });

      if (response.status === 200) {
        setSuccessMessage('Claim closed successfully.');
        setErrorMessage('');
        setCloseReason('');
        setOutcome('');
      }
    } catch (error) {
      setErrorMessage('Failed to close the claim. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <div >
      <h3 className="close-claim-header">Close this Claim</h3>
      {successMessage && <p className="close-claim-success">{successMessage}</p>}
      {errorMessage && <p className="close-claim-error">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="close-claim-form">
        <div className="form-group">
          <label htmlFor="closeReason" className="form-label">
            Reason:
          </label>
          <textarea
            id="closeReason"
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            className="form-textarea"
            placeholder="Provide a reason for closing the claim"
          />
        </div>
        <div className="form-group">
          <label htmlFor="outcome" className="form-label">
            Outcome:
          </label>
          <select
            id="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="form-select"
          >
            <option value="" disabled>
              Select an outcome
            </option>
            {outcomes.map((outcome, index) => (
              <option key={index} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="form-button">
          Close Claim
        </button>
      </form>
    </div>
  );
};

export default CloseClaim;

