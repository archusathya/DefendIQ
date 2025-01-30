import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FraudReport = ({ claimNumber }) => {
  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch fraud claims based on claim number
  useEffect(() => {
    const fetchFraudClaims = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`http://localhost:5000/check-fraud-rules?claimNumber=${claimNumber}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.data) {
          setClaimData(response.data);
        } else {
          setClaimData(null);
          setError('Unexpected response format');
        }
      } catch (err) {
        console.error('Error fetching fraud claims:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (claimNumber) {
      fetchFraudClaims();
    }
  }, [claimNumber]);

  return (
    <div className="fraud-report-container">
      <h4>Fraud Report</h4>
      {loading && <div className="loader"></div>}
      {error && <p className="error-text">{error}</p>}
      {!loading && claimData && (
        <div>
          <h5>Contact Email: {claimData.Email}</h5>
          <p><strong>Is Potential Fraud:</strong> {claimData.IsPotentialFraud ? 'Yes' : 'No'}</p>
          {claimData.IsPotentialFraud && <p><strong>Message:</strong> {claimData.Message}</p>}
        </div>
      )}
    </div>
  );
};

export default FraudReport;
