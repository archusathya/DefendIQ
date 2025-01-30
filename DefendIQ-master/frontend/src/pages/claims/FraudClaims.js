import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './fraudClaims.css';
import '../../component/Spinner.css';
import AssignmentTab from '../../component/AssignmentTab';
import { useParams, Link } from 'react-router-dom';
import FraudReport from '../../component/FraudReports';
import FraudDetection from '../../pages/claims/FraudDetection';

const FraudClaims = () => {
  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAIResponse, setShowAIResponse] = useState(false);
  const [activeTab, setActiveTab] = useState('AI'); 
  const { claimNumber } = useParams(); 
  const [documents, setDocuments] = useState([]);
  const [missingAttachmentsMessage, setMissingAttachmentsMessage] = useState('');

  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const response2 = await axios.get(`http://localhost:5000/read-files/${claimNumber}`);
        const filesData = response2.data.data;
        
        setDocuments(filesData);

        if (filesData.length === 0) {
          setMissingAttachmentsMessage('This claim is missing attachments. Contact the insured for further review.');
        }
      } catch (error) {
        console.error('Error fetching claim details:', error);
        setMissingAttachmentsMessage('Error in http://localhost:5000/read-files/${claimNumber}');
      }
    };

    fetchClaimDetails();
  }, [claimNumber]);


  const fetchFraudClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        'http://localhost:5000/api/fraud-check',
        {}, // Sending an empty JSON object as the request body
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.suspicious_elements) {
        setClaimData(response.data);
        setShowAIResponse(true); // Show AI response only after successful fetch
      } else {
        setClaimData(null);
        setError("Unexpected response format");
        console.error("Expected a structured response, but received:", response.data);
      }
      
    } catch (error) {
      console.error("Error fetching fraud claims", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const docsFraudDetection = () => {
   alert('Document fraud detection is in progress');
  };

  const [activeDocument, setActiveDocument] = useState(null);

  const handleFraudDetection = async (document) => {
    try {
      // Fetch the file from the server
      const response = await axios.get(`http://localhost:5000${document.url}`, {
        responseType: 'blob', // Fetch as a binary Blob
      });
      const file = new File([response.data], document.file_name, { type: response.data.type });
  
      // Pass the file to the FraudDetection component
      setActiveDocument({ ...document, file });
    } catch (error) {
      console.error('Error fetching the document file:', error);
      alert('Failed to fetch the document file for analysis.');
    }
  };
  

  const closeFraudDetection = () => {
    setActiveDocument(null);
  };

  return (
    <div className="fraud-claims-container">
      <div className="tabs">
        <button className={activeTab === 'AI' ? 'active-tab' : ''} onClick={() => handleTabChange('AI')}><i className="material-icons">auto_awesome</i></button>
        <button className={activeTab === 'documents' ? 'active-tab' : ''} onClick={() => handleTabChange('documents')}>Documents fraud detection</button>
        <button className={activeTab === 'FraudReport' ? 'active-tab' : ''} onClick={() => handleTabChange('FraudReport')}>Reports</button>
      </div>
      <div className="tab-content">
      {activeTab === 'AI' && (
          <div>
              {/* Button to Trigger AI Response */}
      <button className="assessment-button" onClick={fetchFraudClaims} disabled={loading}>
        {loading ? 'Loading...' : 'Get AI Recommendations'}
      </button>

      {/* Error and Loading Indicators */}
      {loading && <div className="loader"></div>}
      {error && <p className="error-text">{error}</p>}
      
      {/* Display AI Response Only After Button Click */}
      {showAIResponse && claimData && (
        <div className="ai-response">
          <h4>Fraud Reasons</h4>
          <div className="fraud-reasons">
            {claimData.suspicious_elements.map((element, index) => (
              <div key={index} className="reason-item">
                <strong>{element.field}:</strong> {element.reason}
              </div>
            ))}
          </div>

          <div className="suspicion-status">
            <h4>Overall Suspicion Status</h4>
            <p><strong>Is Fraudulent:</strong> {claimData.is_fraudulent ? 'Yes' : 'No'}</p>
            <p><strong>Fraud Probability:</strong> {claimData.fraud_probability}</p>
          </div>
          <Link to={`/ClaimDetails/${claimNumber}/close-claim`}><button>Accept</button></Link>
          <button>Reject</button>
        </div>
       
      )}
          </div>
        )}
     {activeTab === "documents" && (
        <div>
          <h4>You can download the documents for your verification below, or use GenAI for fraud detection</h4>
          {documents.length > 0 ? (
            <ul>
              {documents.map((doc, index) => (
                <li key={index}>
                  <a href={`http://localhost:5000${doc.url}`} download>
                    {doc.file_name}
                  </a>
                  <button
                    className="GenAI-button"
                    onClick={() => handleFraudDetection(doc)}
                  >
                    <i className="material-icons">auto_awesome</i>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents available for download.</p>
          )}
          {activeDocument && (
            <div className="fraud-detection-modal">
              <FraudDetection
                document={activeDocument}
                onClose={closeFraudDetection}
                claimNumber={claimNumber}
              />
            </div>
          )}
        </div>
      )}
      {activeTab === 'FraudReport' && <FraudReport claimNumber={claimNumber} />}
    </div>
    </div>
  );
};

export default FraudClaims;
