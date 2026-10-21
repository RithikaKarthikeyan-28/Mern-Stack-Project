import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsDistributionChart from '../AnalyticsDistributionChart';
import AnalyticsDonutChart from '../AnalyticsDonutChart';

describe('Analytics Visualization Components', () => {
  describe('AnalyticsDistributionChart', () => {
    const mockItems = [
      { label: 'Completed', value: 80, colorClass: 'bg-emerald-500' },
      { label: 'In Progress', value: 20, colorClass: 'bg-teal-600' },
    ];

    it('renders title, subtitle, items and calculated percentages', () => {
      render(
        <AnalyticsDistributionChart
          title="Enrollment Pipeline"
          subtitle="Cohort status breakdown"
          items={mockItems}
          total={100}
        />
      );

      expect(screen.getByText('Enrollment Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Cohort status breakdown')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getAllByText(/80/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/\(80\.0%\)/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays empty state when total is zero or items are empty', () => {
      render(
        <AnalyticsDistributionChart
          title="Empty Chart"
          items={[]}
          total={0}
        />
      );

      expect(screen.getByText('No distribution data available')).toBeInTheDocument();
    });
  });

  describe('AnalyticsDonutChart', () => {
    const mockDonutItems = [
      { label: 'Compliant', value: 90, color: '#10b981' },
      { label: 'Overdue', value: 10, color: '#ef4444' },
    ];

    it('renders svg elements, center value, center label, and legend items', () => {
      render(
        <AnalyticsDonutChart
          title="Compliance Standing"
          subtitle="Mandatory status"
          centerValue="90%"
          centerLabel="Rate"
          items={mockDonutItems}
        />
      );

      expect(screen.getByText('Compliance Standing')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('Rate')).toBeInTheDocument();
      expect(screen.getByText('Compliant')).toBeInTheDocument();
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('displays fallback when total is zero', () => {
      render(
        <AnalyticsDonutChart
          title="Empty Donut"
          items={[]}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
