import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppShell from '../layouts/AppShell';

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import TrainerDashboard from '../pages/TrainerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import CoursesPage from '../pages/CoursesPage';
import CourseDetailsPage from '../pages/CourseDetailsPage';
import LearningPlayerPage from '../pages/LearningPlayerPage';
import MyLearningPage from '../pages/MyLearningPage';
import AssessmentsPage from '../pages/AssessmentsPage';
import AssessmentDetailsPage from '../pages/AssessmentDetailsPage';
import AssessmentPlayerPage from '../pages/AssessmentPlayerPage';
import AssessmentResultPage from '../pages/AssessmentResultPage';
import CertificatesPage from '../pages/CertificatesPage';
import CertificateDetailsPage from '../pages/CertificateDetailsPage';
import VerifyCertificatePage from '../pages/VerifyCertificatePage';
import NotificationsPage from '../pages/NotificationsPage';
import SkillsPage from '../pages/SkillsPage';
import CompliancePage from '../pages/CompliancePage';
import TrainerCoursesPage from '../pages/TrainerCoursesPage';
import TrainerCurriculumPage from '../pages/TrainerCurriculumPage';
import TrainerAssessmentsPage from '../pages/TrainerAssessmentsPage';
import TrainerAssessmentDetailPage from '../pages/TrainerAssessmentDetailPage';
import TrainerLearnersPage from '../pages/TrainerLearnersPage';
import AdminEmployeesPage from '../pages/AdminEmployeesPage';
import AdminDepartmentsPage from '../pages/AdminDepartmentsPage';
import AdminCoursesPage from '../pages/AdminCoursesPage';
import AdminAssessmentsPage from '../pages/AdminAssessmentsPage';
import AdminCompliancePage from '../pages/AdminCompliancePage';
import AdminCertificatesPage from '../pages/AdminCertificatesPage';
import AdminAnalyticsPage from '../pages/AdminAnalyticsPage';
import PlaceholderPage from '../pages/PlaceholderPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate/:certificateNumber" element={<VerifyCertificatePage />} />
      </Route>

      {/* Authenticated Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Employee Routes */}
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/my-learning" element={<MyLearningPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
          <Route path="/learn/:courseId" element={<LearningPlayerPage />} />
          <Route path="/learn/:courseId/module/:moduleId/lesson/:lessonId" element={<LearningPlayerPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/:assessmentId" element={<AssessmentDetailsPage />} />
          <Route path="/assessments/:assessmentId/attempt" element={<AssessmentPlayerPage />} />
          <Route path="/assessments/:assessmentId/attempt/:attemptId" element={<AssessmentPlayerPage />} />
          <Route path="/assessments/:assessmentId/result/:attemptId" element={<AssessmentResultPage />} />
          
          {/* Certificate Routes */}
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/certificates/:certificateId" element={<CertificateDetailsPage />} />
          <Route path="/certificates/:certificateId/renewals" element={<CertificateDetailsPage />} />

          {/* Skill Gaps Route */}
          <Route path="/skills" element={<SkillsPage />} />

          {/* Compliance Route */}
          <Route path="/compliance" element={<CompliancePage />} />

          {/* Notification Route */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* User Profile */}
          <Route
            path="/profile"
            element={<PlaceholderPage title="My Profile" description="Account settings and security profile." />}
          />

          {/* Trainer Routes (Trainers & Admins) */}
          <Route element={<RoleRoute allowedRoles={['trainer', 'admin']} />}>
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/courses" element={<TrainerCoursesPage />} />
            <Route path="/trainer/courses/:courseId" element={<TrainerCurriculumPage />} />
            <Route path="/trainer/courses/:courseId/curriculum" element={<TrainerCurriculumPage />} />
            <Route path="/trainer/assessments" element={<TrainerAssessmentsPage />} />
            <Route path="/trainer/assessments/:assessmentId" element={<TrainerAssessmentDetailPage />} />
            <Route path="/trainer/learners" element={<TrainerLearnersPage />} />
            <Route path="/trainer/results" element={<TrainerLearnersPage />} />
          </Route>

          {/* Admin Routes (Admin Only) */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<AdminEmployeesPage />} />
            <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
            <Route path="/admin/courses" element={<AdminCoursesPage />} />
            <Route path="/admin/assessments" element={<AdminAssessmentsPage />} />
            <Route path="/admin/compliance" element={<AdminCompliancePage />} />
            <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
