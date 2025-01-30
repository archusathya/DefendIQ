import React from 'react';
import { Link } from 'react-router-dom';

const Step5Success = ({generatedClaimNumber}) => {
  return (
    <div>
      <h3>Claim Submitted Successfully!</h3>
      <p>Your claim number is: {generatedClaimNumber}</p>
      {/* Add any additional actions, such as a button to return to the dashboard */}
      <Link to="/claims"><button >Go to my claims</button></Link>
      <button onClick={() => window.location.href = '/createClaim'}>Create Another Claim</button> 
    </div>
  );
};

export default Step5Success;
