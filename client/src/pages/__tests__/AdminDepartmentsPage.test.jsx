import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDepartmentsPage from '../AdminDepartmentsPage';
import adminService from '../../services/adminService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/adminService', () => ({
  default: {
    getDepartments: vi.fn(),
    getEmployees: vi.fn(),
    getCourses: vi.fn(),
    createDepartment: vi.fn(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
  },
}));

describe('AdminDepartmentsPage', () => {
  const mockDepartments = [
    {
      _id: 'dept-1',
      name: 'Information Security',
      description: 'Protects enterprise infra and enforces data privacy',
      isActive: true,
    },
    {
      _id: 'dept-2',
      name: 'Human Resources',
      description: 'Employee relations and personnel management',
      isActive: false,
    },
  ];

  const mockEmployees = [
    {
      _id: 'e1',
      employeeId: 'EMP-01',
      department: { _id: 'dept-1' },
      isActive: true,
    },
    {
      _id: 'e2',
      employeeId: 'EMP-02',
      department: { _id: 'dept-1' },
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getCourses.mockResolvedValue([]);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminDepartmentsPage />
        </ToastProvider>
      </MemoryRouter>
    );

  it('renders departments list with computed headcounts', async () => {
    adminService.getDepartments.mockResolvedValue(mockDepartments);
    adminService.getEmployees.mockResolvedValue(mockEmployees);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Departments$/i })).toBeInTheDocument();
      expect(screen.getByText('Information Security')).toBeInTheDocument();
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
      expect(screen.getAllByText(/employee/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders mapped course badge when department has associated courses', async () => {
    adminService.getDepartments.mockResolvedValue([
      { _id: 'dept-java', name: 'Java Programming', description: 'Core Java', isActive: true },
    ]);
    adminService.getEmployees.mockResolvedValue([]);
    adminService.getCourses.mockResolvedValue([
      { _id: 'c1', title: 'Java Programming Fundamentals', department: { _id: 'dept-java' } },
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Java Programming')).toBeInTheDocument();
      expect(screen.getByText(/Mapped Course: Java Programming Fundamentals/i)).toBeInTheDocument();
    });
  });

  it('filters departments using search input', async () => {
    adminService.getDepartments.mockResolvedValue(mockDepartments);
    adminService.getEmployees.mockResolvedValue(mockEmployees);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Information Security')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search departments');
    fireEvent.change(searchInput, { target: { value: 'Resources' } });

    expect(screen.queryByText('Information Security')).not.toBeInTheDocument();
    expect(screen.getByText('Human Resources')).toBeInTheDocument();
  });

  it('opens create modal when Add Department is clicked', async () => {
    adminService.getDepartments.mockResolvedValue(mockDepartments);
    adminService.getEmployees.mockResolvedValue(mockEmployees);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^Departments$/i })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add Department/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Create Department/i })).toBeInTheDocument();
  });

  it('deactivates an active department through confirmation dialog', async () => {
    adminService.getDepartments.mockResolvedValue(mockDepartments);
    adminService.getEmployees.mockResolvedValue(mockEmployees);
    adminService.deleteDepartment.mockResolvedValueOnce({ _id: 'dept-1', isActive: false });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Information Security')).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByTitle('Deactivate Department');
    fireEvent.click(deactivateBtn);

    expect(screen.getByText(/Deactivate Department/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /^Deactivate$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminService.deleteDepartment).toHaveBeenCalledWith('dept-1');
    });
  });
});
