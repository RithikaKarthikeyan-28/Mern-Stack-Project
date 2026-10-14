import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminEmployeesPage from '../AdminEmployeesPage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getEmployees: vi.fn(),
    getDepartments: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
    deleteEmployee: vi.fn(),
    getEmployeeCompliance: vi.fn(),
  },
}));

describe('AdminEmployeesPage', () => {
  const mockEmployees = [
    {
      _id: 'emp-1',
      employeeId: 'EMP-1001',
      user: { _id: 'u1', name: 'John Matrix', email: 'matrix@commando.test' },
      department: { _id: 'd1', name: 'Special Ops' },
      designation: 'Colonel',
      phone: '+1 555-0100',
      isActive: true,
    },
    {
      _id: 'emp-2',
      employeeId: 'EMP-1002',
      user: { _id: 'u2', name: 'Sarah Connor', email: 'sarah@resistance.test' },
      department: { _id: 'd2', name: 'Cyber Defense' },
      designation: 'Field Commander',
      phone: '+1 555-0101',
      isActive: false,
    },
  ];

  const mockDepartments = [
    { _id: 'd1', name: 'Special Ops' },
    { _id: 'd2', name: 'Cyber Defense' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminEmployeesPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders workforce header, employee roster, and department badges', async () => {
    adminService.getEmployees.mockResolvedValueOnce(mockEmployees);
    adminService.getDepartments.mockResolvedValueOnce(mockDepartments);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Workforce Management')).toBeInTheDocument();
      expect(screen.getByText('John Matrix')).toBeInTheDocument();
      expect(screen.getByText('EMP-1001')).toBeInTheDocument();
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByText('EMP-1002')).toBeInTheDocument();
    });
  });

  it('filters employees by search query', async () => {
    adminService.getEmployees.mockResolvedValueOnce(mockEmployees);
    adminService.getDepartments.mockResolvedValueOnce(mockDepartments);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Matrix')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search employees');
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });

    expect(screen.queryByText('John Matrix')).not.toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
  });

  it('opens create modal when Add Employee is clicked', async () => {
    adminService.getEmployees.mockResolvedValueOnce(mockEmployees);
    adminService.getDepartments.mockResolvedValueOnce(mockDepartments);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Workforce Management')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add Employee/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Create Employee Profile')).toBeInTheDocument();
  });

  it('inspects employee compliance assignments in a modal', async () => {
    adminService.getEmployees.mockResolvedValueOnce(mockEmployees);
    adminService.getDepartments.mockResolvedValueOnce(mockDepartments);
    adminService.getEmployeeCompliance.mockResolvedValueOnce([
      {
        _id: 'assign-1',
        requirement: { title: 'Annual Workplace Safety' },
        status: 'compliant',
        dueAt: '2026-12-31T00:00:00.000Z',
      },
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Matrix')).toBeInTheDocument();
    });

    const inspectBtns = screen.getAllByTitle(/View Compliance Status/i);
    fireEvent.click(inspectBtns[0]);

    await waitFor(() => {
      expect(adminService.getEmployeeCompliance).toHaveBeenCalledWith('emp-1');
      expect(screen.getByText(/Compliance: John Matrix/i)).toBeInTheDocument();
      expect(screen.getByText('Annual Workplace Safety')).toBeInTheDocument();
    });
  });

  it('deactivates an active employee through confirmation dialog', async () => {
    adminService.getEmployees.mockResolvedValueOnce(mockEmployees);
    adminService.getDepartments.mockResolvedValueOnce(mockDepartments);
    adminService.deleteEmployee.mockResolvedValueOnce({ _id: 'emp-1', isActive: false });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Matrix')).toBeInTheDocument();
    });

    const deactivateBtns = screen.getAllByTitle(/Deactivate Profile/i);
    fireEvent.click(deactivateBtns[0]);

    // ConfirmDialog opens
    expect(screen.getByText(/Deactivate Employee Profile/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /^Deactivate$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteEmployee).toHaveBeenCalledWith('emp-1');
    });
  });
});
