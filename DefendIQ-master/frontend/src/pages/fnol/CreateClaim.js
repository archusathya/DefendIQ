import React, { useState } from 'react';
import PolicySearch from './steps/PolicySearch';
import ClaimInfo from './steps/ClaimInfo';
import IncidentInfo from './steps/IncidentInfo';
import DeviceInfo from './steps/DeviceInfo';
import ContactInfo from './steps/ContactInfo';
import Step5Success from './steps/PostSubmission';
import Sidebar from '../../component/Sidebar';
import axios from 'axios';
import StepIndicator from './steps/StepIndicator';
import './CreateClaim.css';
import LoggedInUser from '../../component/LoginUser';

const CreateClaim = () => {
  const [step, setStep] = useState(1);  // Track the current step
  const totalSteps = 6;
  const [generatedClaimNumber, setgeneratedClaimNumber] = useState(''); // Track the generated claim number
  const [claimData, setClaimData] = useState({
    // Step 1: Policy Search result
    policy_number: '',

    // Step 2: Claim fields
    claim_number: '',
    incident_discovery_date: '',
    reported_by: '',
    reported_via: '',
    attachments: [],
    claimant: '',
    
    // Step 3: Incident fields
    incident_description: '',
    incident_location: '',
    incident_date: '',
    incident_type_id: '',
    incident_subtype_id: '',
    faultRating: '',
    
    // Step 4: Device fields
    device_id: '',
    device_type_id: '',
    make: '',
    model: '',
    imei_number: '',
    
    // Step 5: Contact fields
    contact_name: '',
    contact_phone_number: '',
    contact_email: '',
    contact_address: '',
    contact_pincode: ''
  });

  const [isClaimInfoValid, setIsClaimInfoValid] = useState(false); // Track form validation status
  const [isIncidentInfoValid, setIsIncidentInfoValid] = useState(false);
  const [isDeviceInfoValid, setIsDeviceInfoValid] = useState(false);
  const [isContactInfoValid, setIsContactInfoValid] = useState(false);
  const sessionUser = sessionStorage.getItem('username');
  const handleChange = (e) => {
    if (e.target) {
      // Single field update
      const { name, value } = e.target;
      setClaimData((prevClaimData) => ({
        ...prevClaimData,
        [name]: value,
      }));
    } else {
      // Multiple fields update
      setClaimData((prevClaimData) => ({
        ...prevClaimData,
        ...e,
      }));
    }
  };

  const handlePolicySelect = (policyNumber) => {
    setClaimData({
      ...claimData,
      policy_number: policyNumber
    });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    // Prevent duplicate submissions
  
    e.preventDefault();
    
    const formData = new FormData();
    
    // Append form data fields
    Object.keys(claimData).forEach((key) => {
      if (key === 'attachments' && claimData.attachments) {
          claimData.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      } else {
        formData.append(key, claimData[key]);
      }
    });

    formData.append('sessionUser', sessionUser);
    
    try {
      const response = await axios.post('http://localhost:5000/api/create-claim', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setgeneratedClaimNumber(response.data.claim_number);
      setStep(6); // Move to success confirmation step
    } catch (error) {
      console.log(`Error: ${error.response.data.error}`);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setClaimData({ ...claimData, attachments: files });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <PolicySearch handlePolicySelect={handlePolicySelect} />;
      case 2:
        return (
          <ClaimInfo 
            handleChange={handleChange} 
            claimData={claimData} 
            handleFileChange={handleFileChange} 
            isValid={setIsClaimInfoValid}  // Pass the isValid callback to the child component
          />
        );
      case 3:
        return (
          <IncidentInfo 
          handleChange={handleChange} 
          claimData={claimData}
          isValid={setIsIncidentInfoValid}  />
        );
        
      case 4:
        return (
          <DeviceInfo 
          handleChange={handleChange} 
          claimData={claimData}
          isValid={setIsDeviceInfoValid}
          policyNumber={claimData.policy_number}  />
        );
      case 5:
        return (
          <ContactInfo
          handleChange={handleChange} 
          claimData={claimData}
          isValid={setIsContactInfoValid}  />
        );
      case 6:
        return <Step5Success generatedClaimNumber={generatedClaimNumber} />;
      default:
        return <PolicySearch handlePolicySelect={handlePolicySelect} />;
    }
  };

  return (
    <div className="claimdetails-container">
    <main>
      <form onSubmit={handleSubmit}>
        <div className="create-claim-container">
          <div className="create-claim-content">
            <h3>Create a new Claim</h3>
            <StepIndicator currentStep={step} totalSteps={totalSteps} />
            {renderStep()}
            <div>
              {step > 1 && step < 6 && <button type="button" onClick={prevStep}>Previous</button>}
              {step === 2 && <button type="button" onClick={nextStep} disabled={!isClaimInfoValid}>Next</button>}
              {step === 3 && <button type="button" onClick={nextStep} disabled={!isIncidentInfoValid}>Next</button>}
              {step === 4 && <button type="button" onClick={nextStep} disabled={!isDeviceInfoValid}>Next</button>}
              {step === 5 && <button type="submit" disabled={!isContactInfoValid}>Submit Claim</button>}
              {step === Step5Success }
            </div>
          </div>
        </div>
      </form>
    </main>
  </div>
  );
};

export default CreateClaim;
