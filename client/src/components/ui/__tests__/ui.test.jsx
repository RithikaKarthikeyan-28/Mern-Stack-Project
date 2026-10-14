import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Button from '../Button';
import Input from '../Input';
import Select from '../Select';
import Badge from '../Badge';
import Card from '../Card';
import Modal from '../Modal';
import ProgressBar from '../ProgressBar';
import ProgressCircle from '../ProgressCircle';
import Avatar from '../Avatar';
import EmptyState from '../EmptyState';
import StatCard from '../StatCard';

describe('UI Components Library', () => {
  describe('Button', () => {
    it('renders with default props and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled and loading state', () => {
      render(<Button isLoading disabled>Submit</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });

    it('applies danger and outline variants properly', () => {
      const { rerender } = render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-rose-600');

      rerender(<Button variant="outline">Cancel</Button>);
      expect(screen.getByRole('button')).toHaveClass('border');
    });
  });

  describe('Input', () => {
    it('renders with label, placeholder, and handles change', () => {
      const handleChange = vi.fn();
      render(
        <Input
          label="Email Address"
          placeholder="user@example.com"
          onChange={handleChange}
        />
      );

      const input = screen.getByPlaceholderText('user@example.com');
      expect(input).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'alice@test.com' } });
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders error message and alert role', () => {
      render(<Input label="Password" error="Password is required" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Password is required');
    });
  });

  describe('Select', () => {
    it('renders select options and triggers onChange', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'admin', label: 'Admin' },
        { value: 'employee', label: 'Employee' },
      ];

      render(
        <Select
          label="Role"
          options={options}
          onChange={handleChange}
          placeholder="Choose Role"
        />
      );

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Employee')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'admin' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Badge', () => {
    it('renders text with variant styles and dot', () => {
      render(<Badge variant="success" dot>Completed</Badge>);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders compound Card components', () => {
      render(
        <Card>
          <Card.Header title="Card Title" subtitle="Subtitle here" />
          <Card.Content>Body text content</Card.Content>
          <Card.Footer>Footer content</Card.Footer>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle here')).toBeInTheDocument();
      expect(screen.getByText('Body text content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('renders when open and responds to close click and Escape key', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Modal isOpen={true} onClose={handleClose} title="Dialog Title">
          Modal body
        </Modal>
      );

      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Modal body')).toBeInTheDocument();

      // Click close button
      fireEvent.click(screen.getByLabelText('Close dialog'));
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(2);

      // Not rendered when isOpen is false
      rerender(
        <Modal isOpen={false} onClose={handleClose} title="Dialog Title">
          Modal body
        </Modal>
      );
      expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });
  });

  describe('ProgressBar', () => {
    it('renders percentage with progress bar accessibility', () => {
      render(<ProgressBar value={75} max={100} showLabel label="Course Completion" />);
      expect(screen.getByText('Course Completion')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('ProgressCircle', () => {
    it('renders progress value text', () => {
      render(<ProgressCircle value={82} />);
      expect(screen.getByText('82%')).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('renders user initials when image is not provided', () => {
      render(<Avatar name="Sarah Connor" status="online" />);
      expect(screen.getByText('SC')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and optional action', () => {
      render(
        <EmptyState
          title="No Courses Found"
          description="Try broadening your filter criteria."
          action={<button>Add Course</button>}
        />
      );
      expect(screen.getByText('No Courses Found')).toBeInTheDocument();
      expect(screen.getByText('Try broadening your filter criteria.')).toBeInTheDocument();
      expect(screen.getByText('Add Course')).toBeInTheDocument();
    });
  });

  describe('StatCard', () => {
    it('renders metric title, value, and trend', () => {
      render(
        <StatCard
          title="Total Enrollments"
          value="1,420"
          trend={{ direction: 'up', value: '+15%' }}
        />
      );
      expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
      expect(screen.getByText('1,420')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
    });
  });
});
