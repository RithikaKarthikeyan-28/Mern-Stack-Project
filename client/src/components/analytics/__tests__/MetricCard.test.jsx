import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Award } from 'lucide-react';
import MetricCard from '../MetricCard';

describe('MetricCard Component', () => {
  it('renders title, value, and subtext correctly', () => {
    render(
      <MetricCard
        title="Active Enrollments"
        value={142}
        subtext="Across 12 courses"
      />
    );

    expect(screen.getByText('Active Enrollments')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('Across 12 courses')).toBeInTheDocument();
  });

  it('renders with icon, badge, trend, and progress bar', () => {
    render(
      <MetricCard
        title="Compliance Rate"
        value="95%"
        badge="Mandatory"
        trend={5}
        trendLabel="vs last month"
        progress={95}
        icon={Award}
        variant="success"
      />
    );

    expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Mandatory')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText(/vs last month/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders negative trend with negative sign', () => {
    render(
      <MetricCard
        title="Completion Drop"
        value={45}
        trend={-12}
        variant="danger"
      />
    );

    expect(screen.getByText('-12%')).toBeInTheDocument();
  });

  it('renders dash fallback when value is null or undefined', () => {
    render(<MetricCard title="Empty Value Metric" value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
