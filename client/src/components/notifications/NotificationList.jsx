import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Skeleton from '../ui/Skeleton';

export const NotificationList = ({
  notifications = [],
  loading = false,
  onMarkRead,
  onDelete,
  emptyMessage = 'No notifications found.',
}) => {
  if (loading) {
    return (
      <div className="space-y-3" data-testid="notifications-loading">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white flex gap-4 items-start"
          >
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div
        className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200"
        data-testid="notifications-empty"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800">You&apos;re All Caught Up</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="notifications-list">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id || notif._id}
          notification={notif}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

NotificationList.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onMarkRead: PropTypes.func,
  onDelete: PropTypes.func,
  emptyMessage: PropTypes.string,
};

export default NotificationList;
