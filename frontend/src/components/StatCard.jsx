import React from 'react';

export const StatCard = ({ icon: Icon, title, value, colorClass = 'accent-purple' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${colorClass}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        <h4 className="stat-value">{value !== undefined && value !== null ? value : '-'}</h4>
        <p className="stat-title">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
