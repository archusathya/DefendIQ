import React, { useState, useEffect } from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import './Assessments.css';
import '../../component/Spinner.css';
import AssignmentTab from '../../component/AssignmentTab';

const Assessment = () => {
  const [assessmentData, setAssessmentData] = useState([]);
  const [documentClassificationData, setdocumentClassificationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); 
  const { claimNumber } = useParams(); 
  const [claim, setClaim] = useState({});
  const [incidentDiscoveryMessage, setIncidentDiscoveryMessage] = useState('');
  const [missingAttachmentsMessage, setMissingAttachmentsMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [AIsummary, setAIsummary] = useState(false);

  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const response1 = await axios.get(`http://localhost:5000/api/claim-incident-dates/${claimNumber}`);
        setClaim(response1.data);

        if (response1.data.IncidentDiscoveryDate && response1.data.IncidentDate) {
          const incidentDiscoveryLag = Math.abs(new Date(response1.data.IncidentDiscoveryDate) - new Date(response1.data.IncidentDate)) / (1000 * 60 * 60 * 24);
          if (incidentDiscoveryLag > 5) {
            setIncidentDiscoveryMessage('Incident was discovered more than 90 days after the incident date. Requires further review.');
          }
        }
      } catch (error) {
        console.error(`Fail on calling /api/claim-incident-dates/${claimNumber}`, error);
        setIncidentDiscoveryMessage(`Fail on calling /api/claim-incident-dates/${claimNumber}`);
      }
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

  const fetchFilesData = async () => {
    try {
      setLoading(true);
      setAIsummary(false)
      setError(null);
      setAssessmentData([]);

      const getClaimResponse = await axios.get(`http://localhost:5000/get_claims/${claimNumber}`);
      const claimData = getClaimResponse.data;

      console.log('claimData', claimData);

      const response = await axios.get(`http://localhost:5000/read-files/${claimNumber}`);
      const filesData = response.data.data;
      console.log('filesData', filesData);

      const payload = {
        claimData: claimData,
        filesData: filesData,
      };

      const openAIResponse = await axios.post('http://localhost:5000/process-data', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const summaryAssessments = openAIResponse.data.output;
      const summaryAssessmentsJson = JSON.parse(summaryAssessments);
      setAssessmentData(summaryAssessmentsJson.assessment_details);
      setAIsummary(true)
      console.log('summaryAssessmentsJson', summaryAssessmentsJson);
      
    } catch (error) {
      console.error("Error fetching data", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const classifyDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      setdocumentClassificationData([]);

      const response = await axios.get(`http://localhost:5000/read-files/${claimNumber}`);
      const filesData = response.data.data;
      console.log('filesData', filesData);

      const openAIResponse = await axios.post('http://localhost:5000/classify-documents', {
        data: filesData,
      });
      const classifiedDocuments = openAIResponse.data.output;
      const classifiedDocumentsJson = JSON.parse(classifiedDocuments);
      setdocumentClassificationData(classifiedDocumentsJson.data);
      console.log(classifiedDocumentsJson.data);
      
    } catch (error) {
      console.error("Error fetching data", error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const navigate = useNavigate();

  const handleSelect = (assessment,claimNumber) => {
    navigate(`/ClaimDetails/${claimNumber}/assessment-details`, { state: { assessment, claimNumber} });
  };

  return (
    <div className="assessment-container">
      <div className="assessment-content">
        <h2>Assessment Details</h2>
      <div className="tabs">
        <button className={activeTab === 'summary' ? 'active-tab' : ''}  onClick={() => handleTabChange('summary')}><i className="material-icons">auto_awesome</i></button>
        <button className={activeTab === 'documents' ? 'active-tab' : ''} onClick={() => handleTabChange('documents')}>Verify and classify documents </button>
        <button className={activeTab === 'details' ? 'active-tab' : ''} onClick={() => handleTabChange('details')}>Assessments Reports</button>
      </div>
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div>
            <h4>If you want to get assessment recommendations from AI for this claim you can click below</h4>
            <button className="assessment-button" onClick={fetchFilesData}>Get AI Recommendations</button>
            {loading && <div className="loader"></div>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {AIsummary && <div>
            <h4>Below is a summary from AI, you can select any</h4>
            <table className="claims-table">
              <thead>
                  <tr>
                      <th>S. No</th>
                      <th>Type of Assessment</th>
                      <th>Responsible Party</th>
                      <th>Assessment Focus</th>
                      <th>Key Documents</th>
                      <th>Key Insights</th>
                      <th>Result Summary</th>
                      <th>Recommended Next Steps</th>
                      <th>Estimated Cost</th>
                      <th>Action</th>
                  </tr>
              </thead>
              <tbody>
              {assessmentData.map((assessment, index) => (
                      <tr key={claim.ClaimNumber}>
                          <td>{index+1}</td>
                          <td>{assessment["Type of Assessment"]}</td>
                          <td>{assessment["Responsible Party"]}</td>
                          <td>{assessment["Assessment Focus"]}</td>
                          <td>
                              <ul>
                              {Array.isArray(assessment["Key Documents"]) ? (
                                assessment["Key Documents"].map((doc, docIndex) => (
                                  <li key={docIndex}>{doc}</li>
                                ))
                              ) : (
                                <li>No key documents available</li>
                              )}
                            </ul>
                          </td>
                          <td>{assessment["Key Insights"]}</td>
                          <td>{assessment["Result Summary"]}</td>
                          <td>{assessment["Recommended Next Steps"]}</td>
                          <td>{assessment["Estimated Cost"]}</td>
                          <td>
                          <button className="selectAIassessment-Btn" onClick={() => handleSelect(assessment, claimNumber)}>
                            Select
                          </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
            </div>
            }
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div>
            <h4>You can download the available documents for your verification below</h4>
            {documents.length > 0 ? (
              <div>
                <div>
                  <ul>
                    {documents.map((doc, index) => (
                      <li key={index}>
                        <a href={`http://localhost:5000${doc.url}`} download>{doc.file_name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <br></br>
              <div>
              <h4>If you want to use GenAI to classify the documents submitted for this claim you can click below</h4>
              <button onClick={classifyDocuments}><i className="material-icons">auto_awesome</i> Classify documents</button>
              {loading && <div className="loader"></div>}
              {error && <p style={{ color: 'red' }}>{error}</p>}
              {documentClassificationData.length > 0 ? (
                documentClassificationData.map((documentData, index) => (
                  <div key={index}>
                    <h4><span>{index + 1}. </span>Classification: {documentData.Classification}</h4>
                    <p>Description: {documentData.Description}</p>
                    <p>File Name: {documentData.DocumentName}</p>
                  </div>
                ))
              ) : (
                <p>No classified documents available.</p>
              )}
            </div>
              </div>
            ) : (
              <p>No documents available for download.</p>
            )}
          </div>
        )}
        
        {activeTab === 'details' && (
          <div>
            <h4>Assessments report</h4>
            {incidentDiscoveryMessage && <p style={{ color: 'red' }}>{incidentDiscoveryMessage}</p>}
            {missingAttachmentsMessage && <p style={{ color: 'red' }}>{missingAttachmentsMessage}</p>}
          </div>
        )}

        {/* {activeTab === 'assignment' && <AssignmentTab claimNumber={claimNumber} />} */}
      </div>
    </div>
    </div>
  );
};

export default Assessment;
