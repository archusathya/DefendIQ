import React from 'react';
import './Popup.css';

const Popup = ({ message, onClose }) => (
  <div className="popup-overlay">
    <div className="popup-content">
      <p>{message}</p>
      <button className="popup-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default Popup;
