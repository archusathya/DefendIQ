import React, { useState } from 'react';
import axios from 'axios';

const PolicySearch = ({ handlePolicySelect }) => {
  const [policyNumber, setPolicyNumber] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/policies/${policyNumber}`);
      if (response.data) {
        // Pass the policy number back to the parent if found
        handlePolicySelect(policyNumber);
      } else {
        setError('Policy not found');
      }
    } catch (error) {
      setError('Error fetching policy');
    }
  };

  const validatePolicyNumber = (e) => {
    const value = e.target.value;
    // Allow only alphanumeric characters
    if (/^[a-zA-Z0-9]*$/.test(value)) {
      setPolicyNumber(value);
      setError(''); // Clear error when input is valid
    } else {
      setError('Policy number must be alphanumeric');
    }
  };

  return (
    <div>
      <label>Enter the Policy Number</label>
      <input
        type="text"
        placeholder="Enter Policy Number"
        value={policyNumber}
        onChange={validatePolicyNumber}
      />
      <button type="button" onClick={handleSearch}>
        Search
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PolicySearch;
