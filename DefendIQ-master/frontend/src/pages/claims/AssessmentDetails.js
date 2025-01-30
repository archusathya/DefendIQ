import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Assessments.css"; // Import the CSS file for styling

function AssessmentDetails() {
  const location = useLocation();
  const { assessment: initialAssessment, claimNumber } = location.state || {};
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);

  const [assessment, setAssessment] = useState(initialAssessment || {});

  if (!initialAssessment) {
    return <div>No data available</div>;
  }

  const handleInputChange = (field, value) => {
    setAssessment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAssessment = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/save-assessment", {
        assessment,
        claimNumber,
      });
      setMessage("Assessment saved successfully!");
    } catch (error) {
      console.error("Error saving assessment:", error);
      setMessage("Failed to save assessment. Please try again.");
    }
  };

  const handleCreatePayment = (estimatedcost) => {
    navigate(`/ClaimDetails/${claimNumber}/create-payment`, { state: { estimatedcost: estimatedcost } });
  };

  return (
    <div className="assessment-details-container">
      <div className="assessment-details-content">
      <h3 className="assessment-title">Assessment Details</h3>
      <div className="assessment-form">
        <div className="form-row">
          <label>
            <strong>Type of Assessment:</strong>
            <input
              type="text"
              value={assessment["Type of Assessment"] || ""}
              onChange={(e) => handleInputChange("Type of Assessment", e.target.value)}
            />
          </label>
          <label>
            <strong>Responsible Party:</strong>
            <input
              type="text"
              value={assessment["Responsible Party"] || ""}
              onChange={(e) => handleInputChange("Responsible Party", e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            <strong>Assessment Focus:</strong>
            <textarea
              value={assessment["Assessment Focus"] || ""}
              onChange={(e) => handleInputChange("Assessment Focus", e.target.value)}
            />
          </label>
          <label>
            <strong>Key Documents:</strong>
            <textarea
              value={Array.isArray(assessment["Key Documents"]) ? assessment["Key Documents"].join(", ") : ""}
              onChange={(e) =>
                handleInputChange("Key Documents", e.target.value.split(",").map((doc) => doc.trim()))
              }
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            <strong>Key Insights:</strong>
            <textarea
              value={assessment["Key Insights"] || ""}
              onChange={(e) => handleInputChange("Key Insights", e.target.value)}
            />
          </label>
          <label>
            <strong>Result Summary:</strong>
            <textarea
              value={assessment["Result Summary"] || ""}
              onChange={(e) => handleInputChange("Result Summary", e.target.value)}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            <strong>Recommended Next Steps:</strong>
            <textarea
              value={assessment["Recommended Next Steps"] || ""}
              onChange={(e) => handleInputChange("Recommended Next Steps", e.target.value)}
            />
          </label>
          <label>
            <strong>Estimated Cost:</strong>
            <input
              className="estimated-cost-input"
              type="text"
              value={assessment["Estimated Cost"]|| ""}
              onChange={(e) => handleInputChange("Estimated Cost", e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="button-container">
        <button className="save-button" onClick={handleSaveAssessment}>
          Save Assessment
        </button>
        <button
          className="create-button"
          onClick={() => {
            if (assessment["Estimated Cost"]) {
              handleCreatePayment(assessment["Estimated Cost"]);
            } else {
              setMessage("Estimated Cost is required to create payment.");
            }
          }}
        >
        Create Payment
      </button>
      </div>
      {message && <div className="message">{message}</div>}
    </div>
    </div>
  );
}

export default AssessmentDetails;
