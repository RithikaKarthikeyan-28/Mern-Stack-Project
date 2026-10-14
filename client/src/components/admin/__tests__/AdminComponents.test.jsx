import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminStatusBadge from '../AdminStatusBadge';
import EmployeeModal from '../EmployeeModal';
import DepartmentModal from '../DepartmentModal';
import ComplianceRequirementModal from '../ComplianceRequirementModal';
import ComplianceAssignModal from '../ComplianceAssignModal';
import CertificateRevokeModal from '../CertificateRevokeModal';

describe('Admin Component Suite', () => {
  describe('AdminStatusBadge', () => {
    it('renders all canonical badge states correctly', () => {
      const { rerender } = render(<AdminStatusBadge status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="inactive" />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="published" />);
      expect(screen.getByText('Published')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="draft" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="archived" />);
      expect(screen.getByText('Archived')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="compliant" />);
      expect(screen.getByText('Compliant')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="due_soon" />);
      expect(screen.getByText('Due Soon')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="overdue" />);
      expect(screen.getByText('Overdue')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="not_started" />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="expired" />);
      expect(screen.getByText('Expired')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="revoked" />);
      expect(screen.getByText('Revoked')).toBeInTheDocument();

      rerender(<AdminStatusBadge status="custom_state" />);
      expect(screen.getByText('custom_state')).toBeInTheDocument();
    });
  });

  describe('EmployeeModal', () => {
    const mockDepts = [
      { _id: 'd1', name: 'Engineering' },
      { _id: 'd2', name: 'Operations' },
    ];

    it('renders create mode and validates required fields', async () => {
      const handleSubmit = vi.fn();
      const handleClose = vi.fn();

      render(
        <EmployeeModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          departments={mockDepts}
        />
      );

      expect(screen.getByText('Create Employee Profile')).toBeInTheDocument();

      // Submit without filling
      fireEvent.click(screen.getByRole('button', { name: /Create Profile/i }));

      expect(await screen.findByText(/User ObjectId is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Employee ID is required/i)).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits valid employee creation payload', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <EmployeeModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          departments={mockDepts}
        />
      );

      fireEvent.change(screen.getByLabelText(/User ObjectId \*/i), {
        target: { value: '60d0fe4f5311236168a109ca' },
      });
      fireEvent.change(screen.getByLabelText(/Employee ID \*/i), {
        target: { value: 'EMP-9001' },
      });
      fireEvent.change(screen.getByLabelText(/Department \*/i), {
        target: { value: 'd1' },
      });
      fireEvent.change(screen.getByLabelText(/Designation \/ Role/i), {
        target: { value: 'Security Analyst' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Profile/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            user: '60d0fe4f5311236168a109ca',
            employeeId: 'EMP-9001',
            department: 'd1',
            designation: 'Security Analyst',
          })
        );
      });
      expect(handleClose).toHaveBeenCalled();
    });

    it('renders edit mode with prefilled values', async () => {
      const mockEmp = {
        _id: 'e1',
        employeeId: 'EMP-100',
        designation: 'Staff Dev',
        phone: '+1 555-0100',
        department: { _id: 'd1', name: 'Engineering' },
        user: { _id: 'u1', name: 'Carol Danvers', email: 'carol@marvel.com' },
        isActive: true,
      };

      render(
        <EmployeeModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          employee={mockEmp}
          departments={mockDepts}
        />
      );

      expect(screen.getByText('Edit Employee Profile')).toBeInTheDocument();
      expect(screen.getByText('Carol Danvers')).toBeInTheDocument();
      expect(screen.getByDisplayValue('EMP-100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Staff Dev')).toBeInTheDocument();
    });
  });

  describe('DepartmentModal', () => {
    it('validates department name length on submit', async () => {
      const handleSubmit = vi.fn();
      render(
        <DepartmentModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
        />
      );

      expect(screen.getByRole('heading', { name: 'Create Department' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Create Department/i }));

      expect(await screen.findByText(/Department name is required/i)).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits valid department data and handles close', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <DepartmentModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      );

      fireEvent.change(screen.getByLabelText(/Department Name \*/i), {
        target: { value: 'Cybersecurity' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Brief purpose or function/i), {
        target: { value: 'Information security and governance' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Department/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: 'Cybersecurity',
          description: 'Information security and governance',
        });
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('ComplianceRequirementModal', () => {
    const mockCourses = [
      { _id: 'c1', title: 'Data Privacy Regulations', level: 'beginner' },
    ];

    it('validates required fields on submission', async () => {
      const handleSubmit = vi.fn();
      render(
        <ComplianceRequirementModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={handleSubmit}
          courses={[]}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Create Requirement/i }));
      expect(await screen.findByText(/Requirement title is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Associated course is required/i)).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('submits formatted requirement payload', async () => {
      const handleSubmit = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <ComplianceRequirementModal
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          courses={mockCourses}
        />
      );

      fireEvent.change(screen.getByLabelText(/Requirement Title \*/i), {
        target: { value: 'Annual GDPR Certification' },
      });
      fireEvent.change(screen.getByLabelText(/Due Days \*/i), {
        target: { value: '45' },
      });
      fireEvent.change(screen.getByLabelText(/Grace Days/i), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Create Requirement/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Annual GDPR Certification',
            course: 'c1',
            dueWithinDays: 45,
            renewalGraceDays: 10,
          })
        );
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('ComplianceAssignModal', () => {
    const mockReq = { _id: 'r1', title: 'HIPAA Compliance' };
    const mockDepts = [{ _id: 'd1', name: 'Healthcare Team' }];
    const mockEmps = [
      { _id: 'e1', employeeId: 'EMP-01', user: { name: 'Nurse Joy' }, department: { name: 'Clinic' } },
    ];

    it('switches between department and employee assignment scopes', async () => {
      const handleDeptAssign = vi.fn().mockResolvedValueOnce({});
      const handleEmpAssign = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <ComplianceAssignModal
          isOpen={true}
          onClose={handleClose}
          requirement={mockReq}
          departments={mockDepts}
          employees={mockEmps}
          onAssignDepartment={handleDeptAssign}
          onAssignEmployee={handleEmpAssign}
        />
      );

      expect(screen.getByText('Assign Compliance Requirement')).toBeInTheDocument();

      // Submit department assignment
      fireEvent.click(screen.getByRole('button', { name: /Confirm Assignment/i }));
      await waitFor(() => {
        expect(handleDeptAssign).toHaveBeenCalledWith('r1', 'd1', undefined);
      });

      // Switch to Single Employee
      fireEvent.click(screen.getByRole('button', { name: /Single Employee/i }));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Assignment/i }));

      await waitFor(() => {
        expect(handleEmpAssign).toHaveBeenCalledWith('r1', 'e1', undefined);
      });
    });
  });

  describe('CertificateRevokeModal', () => {
    const mockCert = {
      _id: 'cert-1',
      certificateNumber: 'CERT-2026-9901',
    };

    it('requires formal reason before revocation', async () => {
      const handleRevoke = vi.fn();
      render(
        <CertificateRevokeModal
          isOpen={true}
          onClose={vi.fn()}
          certificate={mockCert}
          onRevoke={handleRevoke}
        />
      );

      expect(screen.getByText('Revoke Issued Certificate')).toBeInTheDocument();
      expect(screen.getByText('CERT-2026-9901')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Revoke Certificate/i }));
      expect(await screen.findByText(/A formal revocation reason is required/i)).toBeInTheDocument();
      expect(handleRevoke).not.toHaveBeenCalled();
    });

    it('submits revocation reason when valid', async () => {
      const handleRevoke = vi.fn().mockResolvedValueOnce({});
      const handleClose = vi.fn();

      render(
        <CertificateRevokeModal
          isOpen={true}
          onClose={handleClose}
          certificate={mockCert}
          onRevoke={handleRevoke}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Credential issued in error/i), {
        target: { value: 'Course assessment invalidated by admin review.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Revoke Certificate/i }));

      await waitFor(() => {
        expect(handleRevoke).toHaveBeenCalledWith(
          'cert-1',
          'Course assessment invalidated by admin review.'
        );
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
