import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation} from 'react-router-dom';
import './CreatePayment.css';
import Popup from '../../component/Popup'; 

const CreatePayment = () => {
  const location = useLocation();
  const { estimatedcost } = location.state || {};
  const { claimNumber } = useParams();
  const [paymentAmount, setpaymentAmount] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (estimatedcost) {
      setpaymentAmount(estimatedcost);
    }
  }, [estimatedcost]);

 
  const [formData, setFormData] = useState({
    payee_name: '',
    check_amount: estimatedcost || '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    document_id: '',
    bank_name: '',
    branch_location: '',
    mmid: '',
    contact: ''
  });
  const [reserveAmount, setReserveAmount] = useState(0);
  const [error, setError] = useState(null);
  const sessionUser = sessionStorage.getItem('username');
  const [popupMessage, setPopupMessage] = useState(null);

  useEffect(() => {
    const fetchReserveAmount = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/payments/${claimNumber}`);
        setReserveAmount(response.data.reserve_amount || 0);
      } catch (error) {
        console.error('Error fetching reserve amount:', error);
        setError(error);
      }
    };

    fetchReserveAmount();
  }, [claimNumber]);

 
   
    

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/create_payment', {
        ...formData,
        claim_number: claimNumber,
        sessionUser : sessionUser
      });
      // alert(response.data.message);
      setPopupMessage(response.data.message); // Show the success message in the pop-up
      setTimeout(() => {
        setPopupMessage(null); // Automatically close the pop-up after 3 seconds
        navigate(-1); // Navigate to the previous page
      }, 2000);
    } catch (error) {
      setError(error.response.data.error);
    }
  };

  const handleBack = () => {
    navigate(-1); // Navigate to the previous page on back button click
  };

  return (
    <div className="create-contact-container">
      <div className="create-contacts-content">
      <h3>Create Payment</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Payee Name:
          <input type="text" name="payee_name" value={formData.payee_name} onChange={handleInputChange} required />
        </label>
        <label>
          Payment Amount:
          <input type="text" name="check_amount" value={formData.check_amount} onChange={handleInputChange} required />
        </label>
        <label>
          Account Number:
          <input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} />
        </label>
        <label>
          IFSC Code:
          <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} />
        </label>
        <label>
          UPI ID:
          <input type="text" name="upi_id" value={formData.upi_id} onChange={handleInputChange} />
        </label>
        {/* <label>
          Document ID:
          <input type="text" name="document_id" value={formData.document_id} onChange={handleInputChange} />
        </label> */}
        <label>
          Bank Name:
          <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} />
        </label>
        {/* <label>
          Branch Location:
          <input type="text" name="branch_location" value={formData.branch_location} onChange={handleInputChange} />
        </label> */}
        {/* <label>
          MMID:
          <input type="text" name="mmid" value={formData.mmid} onChange={handleInputChange} />
        </label> */}
        <label>
          Contact No:
          <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} />
        </label>
        <div className="reserve-amount">
          <strong>Reserve Amount:</strong> {reserveAmount}
        </div>
        <button type="button" onClick={handleBack}>Back</button>
        <button type="submit">Submit</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
    {popupMessage && (
        <Popup
          message={popupMessage}
          onClose={() => setPopupMessage(null)} // Allow manual closing
        />
      )}
    </div>
  );
};

export default CreatePayment;