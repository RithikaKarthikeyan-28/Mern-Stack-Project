import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SkillBadge from '../SkillBadge';
import ProficiencyBar from '../ProficiencyBar';
import SkillCard from '../SkillCard';
import JobRoleCard from '../JobRoleCard';
import SkillGapSummary from '../SkillGapSummary';
import SkillGapCard from '../SkillGapCard';
import RecommendationReason from '../RecommendationReason';
import RecommendedCourseCard from '../RecommendedCourseCard';

describe('Skills Component Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SkillBadge', () => {
    it('renders beginner level badge with correct label and level attr', () => {
      render(<SkillBadge level="beginner" />);
      const badge = screen.getByTestId('skill-badge');
      expect(badge).toHaveAttribute('data-level', 'beginner');
      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('renders intermediate, advanced, and expert badges', () => {
      const { rerender } = render(<SkillBadge level="intermediate" />);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();

      rerender(<SkillBadge level="advanced" />);
      expect(screen.getByText('Advanced')).toBeInTheDocument();

      rerender(<SkillBadge level="expert" />);
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    it('renders unranked fallback when level is undefined or unknown', () => {
      render(<SkillBadge level="unknown_level" />);
      expect(screen.getByText('Unranked')).toBeInTheDocument();
    });

    it('displays numeric rank when showRank is true', () => {
      render(<SkillBadge level="advanced" showRank />);
      expect(screen.getByText('(3/4)')).toBeInTheDocument();
    });
  });

  describe('ProficiencyBar', () => {
    it('renders proficiency bar with segments', () => {
      render(<ProficiencyBar currentLevel="intermediate" showLabels />);
      expect(screen.getByTestId('proficiency-bar')).toBeInTheDocument();
      expect(screen.getByText('Beg')).toBeInTheDocument();
      expect(screen.getByText('Exp')).toBeInTheDocument();
    });

    it('handles numeric ranks and required targets', () => {
      render(<ProficiencyBar currentLevel={2} requiredLevel={4} />);
      const bar = screen.getByTestId('proficiency-bar');
      expect(bar).toBeInTheDocument();
    });
  });

  describe('SkillCard', () => {
    it('renders employee verified skill with title, category, and proficiency badge', () => {
      const mockEmployeeSkill = {
        _id: 'es-1',
        skill: {
          name: 'React.js',
          category: 'Frontend Engineering',
          description: 'Component architecture and hooks mastery',
        },
        proficiencyLevel: 'advanced',
      };

      render(<SkillCard employeeSkill={mockEmployeeSkill} />);
      expect(screen.getByText('React.js')).toBeInTheDocument();
      expect(screen.getByText('Frontend Engineering')).toBeInTheDocument();
      expect(screen.getByText('Component architecture and hooks mastery')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('renders null gracefully when employeeSkill is missing', () => {
      const { container } = render(<SkillCard employeeSkill={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('JobRoleCard', () => {
    it('renders role code, title, and handles selection callback', () => {
      const mockRole = {
        _id: 'role-123',
        name: 'Senior Full Stack Engineer',
        code: 'SWE-SR',
        description: 'Lead engineering systems design',
      };
      const onSelect = vi.fn();

      render(<JobRoleCard jobRole={mockRole} isSelected={false} onSelect={onSelect} />);
      expect(screen.getByText('Senior Full Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('SWE-SR')).toBeInTheDocument();
      expect(screen.getByText('Lead engineering systems design')).toBeInTheDocument();

      const card = screen.getByTestId('job-role-card');
      fireEvent.click(card);
      expect(onSelect).toHaveBeenCalledWith(mockRole);
    });

    it('renders active selected indicator when isSelected is true', () => {
      const mockRole = { _id: 'role-1', name: 'DevOps Architect', code: 'DO-01' };
      render(<JobRoleCard jobRole={mockRole} isSelected={true} />);
      expect(screen.getByText('Selected')).toBeInTheDocument();
      expect(screen.getByText('Active Target')).toBeInTheDocument();
    });

    it('handles keyboard enter selection', () => {
      const mockRole = { _id: 'role-1', name: 'Tester', code: 'QA-01' };
      const onSelect = vi.fn();
      render(<JobRoleCard jobRole={mockRole} onSelect={onSelect} />);

      const card = screen.getByTestId('job-role-card');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledWith(mockRole);
    });
  });

  describe('SkillGapSummary', () => {
    it('renders match percentages and breakdown counts', () => {
      const mockSummary = {
        overallMatchPercentage: 80,
        mandatoryMatchPercentage: 75,
        totalRequirements: 8,
        meetsRequiredSkills: 6,
        belowRequiredSkills: 1,
        missingSkills: 1,
        mandatoryGaps: 1,
      };
      const onViewRecs = vi.fn();

      render(
        <SkillGapSummary
          summary={mockSummary}
          jobRoleTitle="Lead Cloud Architect"
          onViewRecommendations={onViewRecs}
        />
      );

      expect(screen.getByText('Competency Benchmark: Lead Cloud Architect')).toBeInTheDocument();
      expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('6 of 8 criteria met')).toBeInTheDocument();
      expect(screen.getByText('1 mandatory gap')).toBeInTheDocument();

      const recBtn = screen.getByTestId('view-recommendations-btn');
      fireEvent.click(recBtn);
      expect(onViewRecs).toHaveBeenCalledTimes(1);
    });

    it('renders null if summary is missing', () => {
      const { container } = render(<SkillGapSummary summary={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('SkillGapCard', () => {
    it('renders MISSING gap with rose status badge and mandatory flag', () => {
      const mockGap = {
        requirementId: 'req-1',
        skill: { name: 'Kubernetes', category: 'DevOps' },
        requiredLevel: 'advanced',
        currentLevel: null,
        mandatory: true,
        weight: 2,
        status: 'MISSING',
      };

      render(<SkillGapCard gap={mockGap} />);
      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      expect(screen.getByText('DevOps')).toBeInTheDocument();
      expect(screen.getByText('Mandatory')).toBeInTheDocument();
      expect(screen.getByText('Skill Missing')).toBeInTheDocument();
      expect(screen.getByText('Weight multiplier: 2x')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('renders BELOW_REQUIRED gap with amber badge and current level', () => {
      const mockGap = {
        requirementId: 'req-2',
        skill: { name: 'System Design', category: 'Architecture' },
        requiredLevel: 'expert',
        currentLevel: 'intermediate',
        mandatory: false,
        weight: 1,
        status: 'BELOW_REQUIRED',
      };

      render(<SkillGapCard gap={mockGap} />);
      expect(screen.getByText('System Design')).toBeInTheDocument();
      expect(screen.getByText('Optional')).toBeInTheDocument();
      expect(screen.getByText('Below Required')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    it('renders MEETS_REQUIRED gap with emerald badge', () => {
      const mockGap = {
        requirementId: 'req-3',
        skill: { name: 'JavaScript', category: 'Programming' },
        requiredLevel: 'intermediate',
        currentLevel: 'advanced',
        mandatory: true,
        weight: 1,
        status: 'MEETS_REQUIRED',
      };

      render(<SkillGapCard gap={mockGap} />);
      expect(screen.getByText('Meets Requirement')).toBeInTheDocument();
    });
  });

  describe('RecommendationReason', () => {
    it('renders explanation chips for matched skills', () => {
      const mockMatchedSkills = [
        {
          skill: { _id: 's1', name: 'Docker Containers' },
          status: 'MISSING',
          requiredLevel: 'intermediate',
          coverageLevel: 'intermediate',
          mandatory: true,
        },
      ];

      render(<RecommendationReason matchedSkills={mockMatchedSkills} />);
      expect(screen.getByText('Skills Targeted (1)')).toBeInTheDocument();
      expect(screen.getByText('Docker Containers')).toBeInTheDocument();
      expect(screen.getByText(/Acquires missing competency/)).toBeInTheDocument();
      expect(screen.getByText(/Covers intermediate \(Target: intermediate\)/)).toBeInTheDocument();
    });

    it('returns null if matchedSkills array is empty', () => {
      const { container } = render(<RecommendationReason matchedSkills={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('RecommendedCourseCard', () => {
    it('renders recommendation with score, course details, and link to explore course when not enrolled', () => {
      const mockRec = {
        course: {
          _id: 'c-101',
          title: 'Mastering Microservices',
          description: 'Design patterns and event-driven architecture',
          category: 'Architecture',
          level: 'advanced',
          duration: 90,
        },
        score: 92.5,
        mandatoryGapCount: 1,
        matchedSkills: [
          {
            skill: { name: 'Microservices' },
            status: 'MISSING',
            requiredLevel: 'advanced',
            coverageLevel: 'expert',
            mandatory: true,
          },
        ],
        enrollmentStatus: null,
      };

      render(
        <MemoryRouter>
          <RecommendedCourseCard recommendation={mockRec} />
        </MemoryRouter>
      );

      expect(screen.getByText('Mastering Microservices')).toBeInTheDocument();
      expect(screen.getByText('93% Match')).toBeInTheDocument();
      expect(screen.getByText('1 Mandatory')).toBeInTheDocument();
      expect(screen.getByText('90 mins')).toBeInTheDocument();
      expect(screen.getByText('Not enrolled')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Explore Course/ })).toHaveAttribute(
        'href',
        '/courses/c-101'
      );
    });

    it('renders continue learning CTA when enrollmentStatus is in_progress', () => {
      const mockRec = {
        course: {
          _id: 'c-102',
          title: 'Docker in Production',
          category: 'DevOps',
          level: 'intermediate',
          duration: 45,
        },
        score: 85,
        mandatoryGapCount: 0,
        matchedSkills: [],
        enrollmentStatus: 'in_progress',
      };

      render(
        <MemoryRouter>
          <RecommendedCourseCard recommendation={mockRec} />
        </MemoryRouter>
      );

      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Continue Learning/ })).toHaveAttribute(
        'href',
        '/learn/c-102'
      );
    });
  });
});
