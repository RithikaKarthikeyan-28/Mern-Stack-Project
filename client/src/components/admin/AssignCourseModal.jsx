import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { BookOpen, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const AssignCourseModal = ({
  isOpen,
  onClose,
  course,
  departments = [],
  employees = [],
  onAssigned = () => {},
}) => {
  const { success, error: toastError } = useToast();
  const [targetType, setTargetType] = useState('department'); // 'department' | 'employee'
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Course department info
  const courseDeptId = course?.department?._id || course?.department?.id || course?.department || null;
  const isGlobal = course?.isGlobal === true || !courseDeptId;

  // Initialize department selection
  useEffect(() => {
    if (course) {
      if (courseDeptId) {
        setDepartmentId(courseDeptId);
      } else if (departments.length > 0) {
        setDepartmentId(departments[0]._id || departments[0].id || '');
      }
    }
  }, [course, courseDeptId, departments]);

  // Filter eligible employees based on department compatibility
  const eligibleEmployees = useMemo(() => {
    const selectedDept = departmentId || courseDeptId;
    if (isGlobal && !selectedDept) return employees;
    return employees.filter((e) => {
      const eDeptId = e.department?._id || e.department?.id || e.department;
      return eDeptId === selectedDept;
    });
  }, [employees, departmentId, courseDeptId, isGlobal]);

  // Sync employeeId when eligible list changes
  useEffect(() => {
    if (eligibleEmployees.length > 0) {
      setEmployeeId(eligibleEmployees[0]._id || eligibleEmployees[0].id || '');
    } else {
      setEmployeeId('');
    }
  }, [eligibleEmployees]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsSubmitting(true);

    try {
      const courseId = course._id || course.id;
      if (targetType === 'department') {
        if (!departmentId) {
          setServerError('Please select a target department');
          setIsSubmitting(false);
          return;
        }
        const res = await adminService.assignCourseToDepartment(courseId, departmentId, isMandatory);
        success(`Assigned "${course.title}" to ${res.assignedCount || 0} employees in the department.`);
      } else {
        if (!employeeId) {
          setServerError('Please select an eligible employee from the relevant department');
          setIsSubmitting(false);
          return;
        }
        await adminService.assignCourseToEmployee(courseId, employeeId);
        success(`Enrolled employee into "${course.title}".`);
      }
      onAssigned();
      onClose();
    } catch (err) {
      setServerError(err.normalizedMessage || err.message || 'Course assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departmentOptions = departments.map((d) => ({
    value: d._id || d.id,
    label: d.name,
  }));

  const employeeOptions = eligibleEmployees.map((e) => ({
    value: e._id || e.id,
    label: `${e.user?.name || e.employeeId} (${e.department?.name || 'Department'})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Course to Workforce"
      description={`Assign "${course.title}" to eligible employees or departments.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Course Department Info */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
          <span className="text-slate-500 font-medium">Department Alignment:</span>
          {isGlobal ? (
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
              Organization-Wide (Global Course)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
              {course.department?.name || 'Department Specific'}
            </span>
          )}
        </div>

        {/* Target Scope Switcher */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Assignment Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTargetType('department')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                targetType === 'department'
                  ? 'border-teal-700 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Entire Department
            </button>
            <button
              type="button"
              onClick={() => setTargetType('employee')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                targetType === 'employee'
                  ? 'border-teal-700 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Individual Employee
            </button>
          </div>
        </div>

        {/* Target Department Selection */}
        {targetType === 'department' ? (
          <Select
            label="Target Department *"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departmentOptions}
            disabled={!isGlobal && Boolean(courseDeptId)}
            helperText={
              !isGlobal && courseDeptId
                ? 'Locked to this course’s designated department to prevent cross-department mismatch.'
                : 'All eligible active employees in this unit will be enrolled.'
            }
          />
        ) : (
          <div className="space-y-3">
            {isGlobal && (
              <Select
                label="Filter by Department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={departmentOptions}
              />
            )}
            <Select
              label="Select Eligible Employee *"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={employeeOptions}
              helperText={
                eligibleEmployees.length === 0
                  ? 'No eligible employees found in this department.'
                  : `Showing ${eligibleEmployees.length} eligible employee(s) from this department.`
              }
            />
          </div>
        )}

        {/* Mandatory Toggle */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isMandatory}
            onChange={(e) => setIsMandatory(e.target.checked)}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Mandatory learning requirement (tracked in compliance and employee priorities)
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignCourseModal;
