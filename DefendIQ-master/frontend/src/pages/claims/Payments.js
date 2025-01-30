import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Payments.css';

const Payments = () => {
  const { claimNumber } = useParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState([]);
  const [reserveAmount, setReserveAmount] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setError] = useState(null);
  const [successMessage, setSuccess] = useState(null);
  const sessionUser = sessionStorage.getItem('username'); 

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        // Fetch payment details
        const response = await axios.get(`http://localhost:5000/api/payments/${claimNumber}`);
        setPaymentData(response.data.payments || []);
        setReserveAmount(response.data.reserve_amount || 0);

        // Fetch user roles
        const roleResponse = await axios.get(`http://localhost:5000/api/user/roles/${sessionUser}`); // Replace with the actual endpoint
        const roles = roleResponse.data.roles || [];
        const superUserRole = roles.find((role) => role.RoleName === 'Super User');
        setUserRole(superUserRole ? 'Super User' : 'Other');
        console.log('User role2:', userRole); // Debugging statement
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [claimNumber]);

  const handleUpdatePaymentStatus = async (paymentId, status) => {
    const payment = paymentData.find((payment) => payment.PaymentID === paymentId);
    if (payment.Status !== 'Pending') {
      //alert(`Payment is already ${payment.Status.toLowerCase()}`);
      setError(`Payment is already ${payment.Status.toLowerCase()}`)
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/update_payment_status', {
        payment_id: paymentId,
        status: status,
      });
      //alert(response.data.message);
      setSuccess(response.data.message);
      
      setPaymentData(
        paymentData.map((payment) =>
          payment.PaymentID === paymentId ? { ...payment, Status: status } : payment
        )
      );
      if (status === 'Rejected') {
        // Fetch the updated reserve amount
        const reserveResponse = await axios.get(`http://localhost:5000/api/payments/${claimNumber}`);
        setReserveAmount(reserveResponse.data.reserve_amount || 0);
      }
    } catch (error) {
      //alert(error.response?.data?.error || 'An error occurred');
      setError('An error occurred')
    }
  };

  if (loading) return <div>Loading...</div>;
  if (errorMessage) return <div>{errorMessage.message}</div>;

  return (
    <div className="contacts-container">
      <Link to={`/ClaimDetails/${claimNumber}/create-payment`}>
        <button>Create Payment</button>
      </Link>
      <div className="reserve-amount">
        <strong>Reserve Amount:</strong> {reserveAmount}
      </div>
      {paymentData.length > 0 ? (
        <table className="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Payee Name</th>
              <th>Amount</th>
              <th>Bank Name</th>
              {/* <th>Branch Location</th> */}
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((payment) => (
              console.log(payment.Status),
              <tr key={payment.PaymentID}>
                <td>{payment.PaymentID}</td>
                <td>{payment.PayeeName}</td>
                <td>{payment.CheckAmount}</td>
                <td>{payment.BankName}</td>
                {/* <td>{payment.BranchLocation}</td> */}
                <td>{payment.Contact}</td>
                <td>{payment.Status}</td>
                <td>
                  <button
                    onClick={() => handleUpdatePaymentStatus(payment.PaymentID, 'Approved')}
                    disabled={userRole !== 'Super User' || payment.Status !== 'Pending'}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdatePaymentStatus(payment.PaymentID, 'Rejected')}
                    disabled={userRole !== 'Super User' || payment.Status !== 'Pending'}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        
      ) : (
        <div>No payment data available</div>
      )}
       {successMessage && <p className="update-success">{successMessage}</p>}
       {errorMessage && <p className="update-error">{errorMessage}</p>}
    </div>
  );
};

export default Payments;
