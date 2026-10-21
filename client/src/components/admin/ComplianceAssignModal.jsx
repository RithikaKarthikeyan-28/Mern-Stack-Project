import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export const ComplianceAssignModal = ({
  isOpen,
  onClose,
  requirement,
  departments = [],
  employees = [],
  onAssignDepartment,
  onAssignEmployee,
  isLoading = false,
}) => {
  const [targetType, setTargetType] = useState('department'); // 'department' | 'employee'
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [serverError, setServerError] = useState('');

  // Synchronize department based on requirement
  useEffect(() => {
    if (requirement) {
      const reqDeptId =
        requirement.department?._id ||
        requirement.department?.id ||
        requirement.department ||
        departments[0]?._id ||
        departments[0]?.id ||
        '';
      setDepartmentId(reqDeptId);
    }
  }, [requirement, departments]);

  // Filter eligible employees by target department
  const eligibleEmployees = useMemo(() => {
    const isGlobal = requirement?.isGlobal === true;
    if (isGlobal || !departmentId) return employees;
    return employees.filter((e) => {
      const eDeptId = e.department?._id || e.department?.id || e.department;
      return eDeptId === departmentId;
    });
  }, [employees, departmentId, requirement]);

  useEffect(() => {
    if (eligibleEmployees.length > 0) {
      setEmployeeId(eligibleEmployees[0]._id || eligibleEmployees[0].id || '');
    } else {
      setEmployeeId('');
    }
  }, [eligibleEmployees]);

  if (!isOpen || !requirement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    try {
      if (targetType === 'department') {
        if (!departmentId) {
          setServerError('Please select a target department');
          return;
        }
        await onAssignDepartment(requirement._id || requirement.id, departmentId, dueAt || undefined);
      } else {
        if (!employeeId) {
          setServerError('Please select an eligible employee from this department');
          return;
        }
        await onAssignEmployee(requirement._id || requirement.id, employeeId, dueAt || undefined);
      }
      onClose();
    } catch (err) {
      setServerError(err.normalizedMessage || err.message || 'Assignment failed');
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
      title="Assign Compliance Requirement"
      description={`Assign "${requirement.title}" across your workforce.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
            {serverError}
          </div>
        )}

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
              Single Employee
            </button>
          </div>
        </div>

        {targetType === 'department' ? (
          <Select
            label="Target Department *"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departmentOptions}
            helperText="Every active employee in this unit will receive this mandatory assignment."
          />
        ) : (
          <Select
            label="Target Employee *"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={employeeOptions}
          />
        )}

        <Input
          label="Custom Due Date (Optional)"
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          helperText="If omitted, automatically defaults to the requirement's standard due window."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ComplianceAssignModal;
