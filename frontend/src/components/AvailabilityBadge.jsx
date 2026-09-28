import React from 'react';

export const AvailabilityBadge = ({ availableSeats, totalSeats }) => {
  if (totalSeats <= 0 || availableSeats === 0) {
    return (
      <span className="badge badge-soldout">
        <span className="badge-dot dot-red"></span>
        SOLD OUT
      </span>
    );
  }

  const ratio = availableSeats / totalSeats;
  if (ratio <= 0.25 || availableSeats <= 10) {
    return (
      <span className="badge badge-limited">
        <span className="badge-dot dot-amber"></span>
        LIMITED SEATS ({availableSeats} LEFT)
      </span>
    );
  }

  return (
    <span className="badge badge-available">
      <span className="badge-dot dot-green"></span>
      HIGH AVAILABILITY ({availableSeats} SEATS)
    </span>
  );
};

export default AvailabilityBadge;
