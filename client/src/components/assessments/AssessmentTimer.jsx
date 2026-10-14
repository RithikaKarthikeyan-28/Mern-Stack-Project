import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 * @param {number} totalSeconds
 * @returns {string}
 */
export const formatTime = (totalSeconds) => {
  if (totalSeconds == null || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const AssessmentTimer = ({
  initialSeconds = 0,
  onTimeUp,
  warningThresholdSeconds = 300, // 5 minutes
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
    hasExpiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (!hasExpiredRef.current && onTimeUpRef.current) {
        hasExpiredRef.current = true;
        onTimeUpRef.current();
      }
      return;
    }

    const timerId = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          if (!hasExpiredRef.current && onTimeUpRef.current) {
            hasExpiredRef.current = true;
            onTimeUpRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [secondsRemaining]);

  if (initialSeconds <= 0) {
    return null;
  }

  const isWarning = secondsRemaining > 0 && secondsRemaining <= warningThresholdSeconds;
  const isExpired = secondsRemaining === 0;

  let timerStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-4 h-4 text-slate-500" />;

  if (isExpired) {
    timerStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    icon = <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />;
  } else if (isWarning) {
    timerStyles = 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse';
    icon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
  }

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-colors ${timerStyles}`}
      data-testid="assessment-timer"
    >
      {icon}
      <span className="tabular-nums font-mono font-medium">
        {formatTime(secondsRemaining)}
      </span>
      {isWarning && !isExpired && (
        <span className="sr-only">Warning: less than 5 minutes remaining</span>
      )}
      {isExpired && (
        <span className="sr-only">Time has expired</span>
      )}
    </div>
  );
};

AssessmentTimer.propTypes = {
  initialSeconds: PropTypes.number.isRequired,
  onTimeUp: PropTypes.func,
  warningThresholdSeconds: PropTypes.number,
};

export default AssessmentTimer;
