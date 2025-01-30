import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PolicyInformation.css'; 
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';

const PolicyInformation = () => {
  const { policyNumber } = useParams();
  const [policyData, setPolicyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize navigate
  const queryParams = new URLSearchParams(location.search);
  const claimNumber = queryParams.get('claimNumber');

  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/policies/${policyNumber}`);
        setPolicyData([response.data]); // Ensure the data is set as an array
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPolicyData();
  }, [policyNumber]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const handleBack = () => {
    navigate(-1); // Navigate to the previous page on back button click
  };

  return (
    <div className="policy-information-container">
      <div className="policy-content">
        <h1>Policy Information</h1>
        <div className="policy-details">
        <button type="button" onClick={handleBack}>Back</button>
        {Array.isArray(policyData) && policyData.map((policy) => (
          <div key={policy.PolicyNumber}>
            <p><strong>Policy Number:</strong> {policy.PolicyNumber}</p>
            <p><strong>Effective Date:</strong> {new Date(policy.EffectiveDate).toLocaleDateString()}</p>
            <p><strong>Expiration Date:</strong> {new Date(policy.ExpirationDate).toLocaleDateString()}</p>
            <p><strong>Policy Type:</strong> {policy.PolicyType}</p>
            <p><strong>Endorsement Code:</strong> {policy.EndorsementCode}</p>
            <p><strong>Endorsement Description:</strong> {policy.EndorsementDescription}</p>
            <p><strong>Endorsement Effective Date:</strong> {new Date(policy.EndorsementEffectiveDate).toLocaleDateString()}</p>
            <p><strong>Endorsement Expiration Date:</strong> {new Date(policy.EndorsementExpirationDate).toLocaleDateString()}</p>
            <p><strong>Insured Name:</strong> {policy.InsuredName}</p>
            <p><strong>Insured Email:</strong> {policy.InsuredEmail}</p>
            <p><strong>Policy Status:</strong> {policy.PolicyStatus}</p>
            <p><strong>Coverages:</strong> {policy.Coverages}</p>
            <p><strong>Device ID:</strong> {policy.DeviceID}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
    
  );
};

export default PolicyInformation;
