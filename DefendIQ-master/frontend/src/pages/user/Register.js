import './Register.css'; // Import the CSS file for styling
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    securityQuestionId: '',
    securityAnswer: ''
  });

  const [securityQuestions, setSecurityQuestions] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/security-questions');
        setSecurityQuestions(response.data);
      } catch (error) {
        console.error('Error fetching security questions:', error);
      }
    };

    fetchSecurityQuestions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/register', formData);
      if (response.status === 201) {
        navigate('/usersadmin');
      }
    } catch (error) {
      setError('Error registering user.');
      console.error('Error registering user:', error);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <h2>Enter the user details</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>First Name:</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div>
            <label>Last Name:</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Username:</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div>
            <label>Confirm Password:</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <div>
            <label>Security Question:</label>
            <select name="securityQuestionId" value={formData.securityQuestionId} onChange={handleChange} required>
              <option value="">Select a security question</option>
              {securityQuestions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.question}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Security Answer:</label>
            <input type="text" name="securityAnswer" value={formData.securityAnswer} onChange={handleChange} required />
          </div>
          <button type="submit">Register</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;
