import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyticsFilterBar from '../AnalyticsFilterBar';

describe('AnalyticsFilterBar Component', () => {
  const mockDepartments = [
    { _id: 'd1', name: 'Engineering' },
    { _id: 'd2', name: 'Marketing' },
  ];
  const mockCourses = [
    { _id: 'c1', title: 'React Basics' },
    { _id: 'c2', title: 'Node.js Mastery' },
  ];

  it('renders quick date preset buttons', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{ datePreset: 'all' }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleReset}
        departments={mockDepartments}
        courses={mockCourses}
      />
    );

    expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  it('triggers onFilterChange when a date preset button is clicked', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{ datePreset: 'all' }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleReset}
        departments={mockDepartments}
        courses={mockCourses}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '30 Days' }));
    expect(handleFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        datePreset: '30d',
        from: expect.any(String),
        to: expect.any(String),
      })
    );
  });

  it('toggles advanced filters drawer and updates department/course filters', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{ datePreset: 'all' }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleReset}
        departments={mockDepartments}
        courses={mockCourses}
      />
    );

    // Toggle advanced filter panel
    fireEvent.click(screen.getByRole('button', { name: /toggle filter options/i }));

    const deptSelect = screen.getByLabelText(/Department/i);
    fireEvent.change(deptSelect, { target: { value: 'd1' } });
    expect(handleFilterChange).toHaveBeenCalledWith({ departmentId: 'd1' });

    const courseSelect = screen.getByLabelText(/Course/i);
    fireEvent.change(courseSelect, { target: { value: 'c2' } });
    expect(handleFilterChange).toHaveBeenCalledWith({ courseId: 'c2' });
  });

  it('renders active filter badge and calls onResetFilters when Reset is clicked', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <AnalyticsFilterBar
        filters={{ datePreset: '30d', from: '2026-01-01', to: '2026-01-31', departmentId: 'd1' }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleReset}
        departments={mockDepartments}
        courses={mockCourses}
      />
    );

    expect(screen.getByText(/Active filters:/i)).toBeInTheDocument();
    expect(screen.getByText(/Dept: Engineering/i)).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /reset all filters/i });
    expect(resetButton).toBeInTheDocument();
    fireEvent.click(resetButton);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
