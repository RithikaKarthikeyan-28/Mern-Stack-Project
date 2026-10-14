import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SkillsPage from '../SkillsPage';
import skillService from '../../services/skillService';

vi.mock('../../services/skillService', () => ({
  default: {
    getMySkills: vi.fn(),
    getJobRoles: vi.fn(),
    getMySkillGap: vi.fn(),
    getMyRecommendations: vi.fn(),
  },
}));

const mockSkills = [
  {
    _id: 'es1',
    skill: {
      _id: 's1',
      name: 'React.js',
      category: 'Frontend',
      description: 'Component architecture',
    },
    proficiencyLevel: 'advanced',
  },
  {
    _id: 'es2',
    skill: {
      _id: 's2',
      name: 'Node.js',
      category: 'Backend',
      description: 'Server development',
    },
    proficiencyLevel: 'intermediate',
  },
];

const mockJobRoles = [
  {
    _id: 'jr1',
    name: 'Lead Full Stack Engineer',
    code: 'FSE-01',
    description: 'Architecture and end-to-end web apps',
  },
  {
    _id: 'jr2',
    name: 'DevOps Architect',
    code: 'DO-01',
    description: 'Infrastructure and continuous delivery',
  },
];

const mockGapReport = {
  summary: {
    overallMatchPercentage: 70,
    mandatoryMatchPercentage: 75,
    totalRequirements: 4,
    meetsRequiredSkills: 2,
    belowRequiredSkills: 1,
    missingSkills: 1,
    mandatoryGaps: 1,
  },
  gaps: [
    {
      requirementId: 'g1',
      skill: { _id: 's1', name: 'React.js', category: 'Frontend' },
      requiredLevel: 'advanced',
      currentLevel: 'advanced',
      mandatory: true,
      weight: 1,
      status: 'MEETS_REQUIRED',
    },
    {
      requirementId: 'g2',
      skill: { _id: 's2', name: 'Node.js', category: 'Backend' },
      requiredLevel: 'advanced',
      currentLevel: 'intermediate',
      mandatory: true,
      weight: 1,
      status: 'BELOW_REQUIRED',
    },
    {
      requirementId: 'g3',
      skill: { _id: 's3', name: 'Docker', category: 'DevOps' },
      requiredLevel: 'intermediate',
      currentLevel: null,
      mandatory: true,
      weight: 2,
      status: 'MISSING',
    },
  ],
};

const mockRecommendationsReport = {
  summary: {
    totalGapSkills: 2,
    candidateCourses: 2,
    returnedCourses: 2,
  },
  recommendations: [
    {
      course: {
        _id: 'c1',
        title: 'Docker & Kubernetes Deep Dive',
        description: 'Complete container orchestration',
        category: 'DevOps',
        level: 'intermediate',
        duration: 90,
      },
      score: 95,
      mandatoryGapCount: 1,
      optionalGapCount: 0,
      matchedSkills: [
        {
          skill: { _id: 's3', name: 'Docker', category: 'DevOps' },
          status: 'MISSING',
          requiredLevel: 'intermediate',
          coverageLevel: 'intermediate',
          mandatory: true,
        },
      ],
      enrollmentStatus: null,
    },
    {
      course: {
        _id: 'c2',
        title: 'Advanced Node.js Backend Patterns',
        description: 'Microservices and performance tuning',
        category: 'Backend',
        level: 'advanced',
        duration: 120,
      },
      score: 80,
      mandatoryGapCount: 1,
      optionalGapCount: 0,
      matchedSkills: [
        {
          skill: { _id: 's2', name: 'Node.js', category: 'Backend' },
          status: 'BELOW_REQUIRED',
          currentLevel: 'intermediate',
          requiredLevel: 'advanced',
          coverageLevel: 'advanced',
          mandatory: true,
        },
      ],
      enrollmentStatus: 'in_progress',
    },
  ],
};

const renderComponent = (initialEntries = ['/skills']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/courses/:courseId" element={<div data-testid="course-page">Course Page</div>} />
        <Route path="/learn/:courseId" element={<div data-testid="learn-page">Learning Player</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('SkillsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    skillService.getMySkills.mockResolvedValue({ employeeSkills: mockSkills, total: 2 });
    skillService.getJobRoles.mockResolvedValue(mockJobRoles);
    skillService.getMySkillGap.mockResolvedValue(mockGapReport);
    skillService.getMyRecommendations.mockResolvedValue(mockRecommendationsReport);
  });

  it('renders header banner and 3 navigation tabs', async () => {
    renderComponent();

    expect(screen.getByText('Skills & Competency Hub')).toBeInTheDocument();
    expect(screen.getByTestId('tab-my-skills')).toBeInTheDocument();
    expect(screen.getByTestId('tab-gap-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('tab-recommendations')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('React.js')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('filters employee skills by search query', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React.js')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('skill-search-input');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.getByText('React.js')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
  });

  it('filters employee skills by category dropdown', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('React.js')).toBeInTheDocument();
    });

    const categorySelect = screen.getByTestId('skill-category-filter');
    fireEvent.change(categorySelect, { target: { value: 'Backend' } });

    expect(screen.queryByText('React.js')).not.toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('displays empty state when employee has no skills recorded', async () => {
    skillService.getMySkills.mockResolvedValueOnce({ employeeSkills: [], total: 0 });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No verified skills recorded yet')).toBeInTheDocument();
    });
  });

  it('displays error state when getMySkills fails and allows retry', async () => {
    skillService.getMySkills.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Unable to load skills')).toBeInTheDocument();
    });

    skillService.getMySkills.mockResolvedValueOnce({ employeeSkills: mockSkills, total: 2 });
    const retryBtn = screen.getByText('Try Again');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('React.js')).toBeInTheDocument();
    });
  });

  it('switches to Role Benchmark & Gap Analysis tab and renders roles and gap summary', async () => {
    renderComponent();

    const gapTab = screen.getByTestId('tab-gap-analysis');
    fireEvent.click(gapTab);

    await waitFor(() => {
      expect(screen.getByText('Competency Benchmark: Lead Full Stack Engineer')).toBeInTheDocument();
      expect(screen.getAllByText('70%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Skill Missing')).toBeInTheDocument();
    expect(screen.getAllByText('Below Required').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Meets Requirement')).toBeInTheDocument();
  });

  it('filters skill gaps by status filter button', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('tab-gap-analysis'));

    await waitFor(() => {
      expect(screen.getByText('Competency Benchmark: Lead Full Stack Engineer')).toBeInTheDocument();
    });

    const missingBtn = screen.getByTestId('gap-filter-missing');
    fireEvent.click(missingBtn);

    expect(skillService.getMySkillGap).toHaveBeenCalledWith('jr1', { status: 'MISSING' });
  });

  it('filters skill gaps by mandatory toggle', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('tab-gap-analysis'));

    await waitFor(() => {
      expect(screen.getByText('Competency Benchmark: Lead Full Stack Engineer')).toBeInTheDocument();
    });

    const mandatoryToggle = screen.getByTestId('gap-mandatory-toggle');
    fireEvent.click(mandatoryToggle);

    expect(skillService.getMySkillGap).toHaveBeenCalledWith('jr1', { mandatory: 'true' });
  });

  it('selects a different job role to analyze', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('tab-gap-analysis'));

    await waitFor(() => {
      expect(screen.getByText('DevOps Architect')).toBeInTheDocument();
    });

    const devopsRoleBtn = screen.getByTestId('select-role-jr2');
    fireEvent.click(devopsRoleBtn);

    await waitFor(() => {
      expect(skillService.getMySkillGap).toHaveBeenCalledWith('jr2', {});
    });
  });

  it('switches to Course Recommendations tab and displays course recommendations with match scores and actions', async () => {
    renderComponent();

    const recTab = screen.getByTestId('tab-recommendations');
    fireEvent.click(recTab);

    await waitFor(() => {
      expect(screen.getByText('Docker & Kubernetes Deep Dive')).toBeInTheDocument();
      expect(screen.getByText('95% Match')).toBeInTheDocument();
      expect(screen.getByText('Advanced Node.js Backend Patterns')).toBeInTheDocument();
      expect(screen.getByText('80% Match')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Explore Course/ })).toHaveAttribute('href', '/courses/c1');
    expect(screen.getByRole('link', { name: /Continue Learning/ })).toHaveAttribute('href', '/learn/c2');
  });

  it('filters course recommendations by minScore and mandatoryOnly', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('tab-recommendations'));

    await waitFor(() => {
      expect(screen.getByText('Docker & Kubernetes Deep Dive')).toBeInTheDocument();
    });

    const minScoreSelect = screen.getByTestId('rec-minscore-filter');
    fireEvent.change(minScoreSelect, { target: { value: '75' } });

    expect(skillService.getMyRecommendations).toHaveBeenCalledWith('jr1', { minScore: 75 });

    const mandatoryToggle = screen.getByTestId('rec-mandatory-toggle');
    fireEvent.click(mandatoryToggle);

    expect(skillService.getMyRecommendations).toHaveBeenCalledWith('jr1', {
      minScore: 75,
      mandatoryOnly: 'true',
    });
  });

  it('clicking View Recommendations CTA in gap summary switches to recommendations tab', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('tab-gap-analysis'));

    await waitFor(() => {
      expect(screen.getByTestId('view-recommendations-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('view-recommendations-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('recommendations-section')).toBeInTheDocument();
    });
  });

  it('handles gap analysis error gracefully without breaking the page', async () => {
    skillService.getMySkillGap.mockRejectedValueOnce(new Error('Gap failure'));

    renderComponent();

    fireEvent.click(screen.getByTestId('tab-gap-analysis'));

    await waitFor(() => {
      expect(screen.getByText('Skill gap analysis failed')).toBeInTheDocument();
    });

    // Tab 1 still works!
    fireEvent.click(screen.getByTestId('tab-my-skills'));
    expect(screen.getByText('React.js')).toBeInTheDocument();
  });
});
