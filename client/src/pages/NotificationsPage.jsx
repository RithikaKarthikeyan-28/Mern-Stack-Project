import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Filter,
} from 'lucide-react';
import notificationService from '../services/notificationService';
import NotificationList from '../components/notifications/NotificationList';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import Select from '../components/ui/Select';
import Pagination from '../components/ui/Pagination';
import { useToast } from '../context/ToastContext';

export const NotificationsPage = () => {
  const { addToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'unread' | 'read'
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [markingAll, setMarkingAll] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Non-fatal
    }
  }, []);

  const fetchNotifications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 15,
        };

        if (statusTab === 'unread') {
          params.isRead = false;
        } else if (statusTab === 'read') {
          params.isRead = true;
        }

        if (typeFilter !== 'all') {
          params.type = typeFilter;
        }

        const res = await notificationService.getNotifications(params);
        setNotifications(res.notifications || []);
        setPagination(
          res.pagination || {
            page: 1,
            limit: 15,
            total: res.notifications?.length || 0,
            totalPages: 1,
          }
        );
      } catch (err) {
        addToast({
          type: 'danger',
          message: err.response?.data?.message || 'Failed to load notifications.',
        });
      } finally {
        setLoading(false);
      }
    },
    [statusTab, typeFilter, addToast]
  );

  useEffect(() => {
    fetchNotifications(pagination.page);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, pagination.page]);

  const handleStatusTabChange = (key) => {
    setStatusTab(key);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n._id) === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      addToast({ type: 'success', message: 'Notification marked as read.' });
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to update notification.',
      });
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast({
        type: 'success',
        message: res.message || 'All notifications marked as read.',
      });
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to mark all as read.',
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      const deletedItem = notifications.find((n) => (n.id || n._id) === id);
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== id));
      addToast({ type: 'success', message: 'Notification removed.' });
    } catch (err) {
      addToast({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to delete notification.',
      });
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'read', label: 'Read' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'certificate_issued', label: 'Certificate Earned' },
    { value: 'certificate_expiring', label: 'Certificate Expiring' },
    { value: 'certificate_expired', label: 'Certificate Expired' },
    { value: 'certificate_renewed', label: 'Certificate Renewed' },
    { value: 'compliance_due_soon', label: 'Compliance Due Soon' },
    { value: 'compliance_overdue', label: 'Compliance Overdue' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#102A2A] tracking-tight">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-teal-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Platform alerts, expiration notices, and compliance reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={markingAll}
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-teal-700" />
              <span>Mark all as read</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchNotifications(pagination.page);
              fetchUnreadCount();
            }}
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs tabs={statusTabs} activeTab={statusTab} onChange={handleStatusTabChange} />

        <div className="flex items-center gap-2 w-full md:w-56">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={handleTypeChange}
            className="text-xs py-1.5"
          />
        </div>
      </div>

      {/* Notifications List */}
      <NotificationList
        notifications={notifications}
        loading={loading}
        onMarkRead={handleMarkAsRead}
        onDelete={handleDelete}
        emptyMessage={
          statusTab === 'unread'
            ? 'You have zero unread notifications!'
            : 'No notification records found in this view.'
        }
      />

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
