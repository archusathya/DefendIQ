import React, { useState, useEffect } from "react";
import axios from "axios";

const FraudDetection = ({ document, onClose, claimNumber}) => {
  const [result, setResult] = useState(null);
  const [assessmentResult, setassessmentResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (document && document.file) {
      analyzeDocument(document.file);
    }
  }, [document]);

  const analyzeDocument = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    console.log("claimNumber", claimNumber);
    formData.append("claimNumber", claimNumber);
    formData.append("file", file);
    formData.append("title", document.file_name);
    formData.append("submission_date", document.submission_date || new Date().toISOString().split("T")[0]);
    console.log("formData", file);
    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(response.data);
      setassessmentResult(JSON.parse(response.data.assessment));
      console.log(JSON.parse(response.data.assessment));
    } catch (err) {
      console.error("Error during document analysis:", err);
      setError(err.response?.data?.error || "An error occurred while processing the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {loading && <p>Analyzing document...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div className="analysis-result">
          <h3>Analysis Result</h3>
          <div>
            <strong>Metadata:</strong>
            <ul>
              <li><strong>Creation Date:</strong> {result.metadata.creation_date}</li>
              <li><strong>Modification Date:</strong> {result.metadata.modification_date}</li>
              <li><strong>File Format:</strong> {result.metadata.file_format}</li>
            </ul>
          </div>
          <div>
            <strong>Summary:</strong>
            <div>
              
                <div >
                  <p>Title: {assessmentResult.data.Title}</p>
                  <p>Assessment: {assessmentResult.data.Assessment}</p>
                  <p>Conclusion: {assessmentResult.data.Conclusion}</p>
                  <p>Reasoning: {assessmentResult.data.Reasoning}</p>
                  
                  {/* <ul>
                    {Array.isArray(assessment["Key Documents"]) ? (
                      assessment["Key Documents"].map((doc, docIndex) => (
                        <li key={docIndex}>{doc}</li>
                      ))
                    ) : (
                      <li>No key documents available</li>
                    )}
                  </ul> */}
                </div>
            </div>
          </div>
        </div>
      )}
      <button onClick={onClose} style={{ marginTop: "20px" }}>
        Close
      </button>
    </div>
  );
};

export default FraudDetection;
