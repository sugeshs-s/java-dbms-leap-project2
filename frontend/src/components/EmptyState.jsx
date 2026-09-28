import React from 'react';
import { Film } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Film,
  title = 'No items found',
  message = 'There is currently no data to display.',
  actionText,
  onAction,
}) => {
  return (
    <div className="empty-state-box">
      <div className="empty-icon-circle">
        <Icon size={40} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
