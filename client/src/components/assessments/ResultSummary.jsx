import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Calendar,
  Layers,
  ExternalLink,
  Download,
  Mail,
  AlertCircle,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import certificateService from '../../services/certificateService';

export const ResultSummary = ({
  resultData,
  onRetake,
  canRetake = false,
  remainingAttempts = null,
}) => {
  const [downloading, setDownloading] = useState(false);
  if (!resultData) return null;

  const {
    assessment = {},
    attemptNumber,
    totalMarks = 0,
    obtainedMarks = 0,
    percentage = 0,
    result,
    evaluatedAt,
  } = resultData;

  const isPassed = result === 'passed';
  const passingPercentage = assessment?.passingPercentage ?? 60;
  const courseId = assessment?.course?._id || assessment?.course?.id || assessment?.course;
  const courseTitle = assessment?.course?.title || 'Associated Course';

  const certObj = resultData?.certificate || {};
  const certificateId = certObj._id || certObj.id || resultData?.certificateId;
  const certificateNumber = certObj.certificateNumber || resultData?.certificateNumber;

  const formattedDate = evaluatedAt
    ? new Date(evaluatedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  const certIssuedDate = certObj.issuedAt
    ? new Date(certObj.issuedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const handleDownload = async () => {
    if (!certificateId) return;
    setDownloading(true);
    try {
      await certificateService.downloadCertificatePDF(certificateId, certificateNumber);
    } catch (err) {
      console.error('Failed to download certificate PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card
      className={`border overflow-hidden shadow-md ${
        isPassed ? 'border-emerald-200' : 'border-rose-200'
      }`}
      padding={false}
      data-testid="assessment-result-summary"
    >
      {/* Hero Banner */}
      <div
        className={`p-6 sm:p-8 text-center relative ${
          isPassed
            ? 'bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-white'
            : 'bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-white'
        }`}
      >
        {/* Status Icon */}
        <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 shadow-sm bg-white border border-slate-100">
          {isPassed ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          ) : (
            <XCircle className="w-12 h-12 text-rose-600" />
          )}
        </div>

        {/* Status Headline */}
        <div className="space-y-1.5">
          <Badge
            variant={isPassed ? 'success' : 'danger'}
            size="md"
            className="font-bold text-xs uppercase tracking-wider"
          >
            {isPassed ? 'Assessment Passed' : 'Assessment Not Passed'}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A2A] mt-2">
            {isPassed ? 'Congratulations! You Passed!' : 'Keep Learning'}
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isPassed
              ? `You achieved ${percentage}% and exceeded the required ${passingPercentage}% passing threshold.`
              : `You scored ${percentage}%. A minimum score of ${passingPercentage}% is required to pass this assessment.`}
          </p>

          {isPassed && certificateNumber && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold shadow-2xs">
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Certificate ID:</span>
                <code className="font-mono font-bold text-emerald-950">{certificateNumber}</code>
              </div>

              {certIssuedDate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issued: {certIssuedDate}</span>
                </div>
              )}

              {certObj.emailStatus && (
                <div className="inline-flex items-center">
                  {certObj.emailStatus === 'sent' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Certificate Emailed</span>
                    </span>
                  )}
                  {certObj.emailStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-medium">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Queued</span>
                    </span>
                  )}
                  {certObj.emailStatus === 'not_configured' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Direct Download Ready</span>
                    </span>
                  )}
                  {certObj.emailStatus === 'failed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Email Delivery Notice</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score Metacards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6 text-left">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Percentage
            </span>
            <span className={`text-2xl font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {percentage}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Marks Obtained
            </span>
            <span className="text-2xl font-black text-[#102A2A]">
              {obtainedMarks} <span className="text-sm text-slate-400 font-normal">/ {totalMarks}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Passing Mark
            </span>
            <span className="text-2xl font-black text-[#102A2A]">
              {passingPercentage}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              Attempt #
            </span>
            <span className="text-2xl font-black text-teal-700">
              {attemptNumber || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Evaluated on {formattedDate}</span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          {!isPassed && canRetake && remainingAttempts != null && (
            <p className="text-slate-600 font-medium">
              You have {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.
            </p>
          )}
          {!isPassed && !canRetake && (
            <p className="text-rose-600 font-medium">
              Maximum allowed attempts reached for this assessment.
            </p>
          )}
          {isPassed && (
            <p className="text-emerald-700 font-medium flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Assessment complete.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {isPassed && certificateId && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
              disabled={downloading}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              {downloading ? 'Downloading...' : 'Download Certificate'}
            </Button>
          )}

          {isPassed && (
            <Link to={certificateId ? `/certificates/${certificateId}` : '/certificates'}>
              <Button
                variant="outline"
                size="md"
                leftIcon={<Award className="w-4 h-4" />}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold"
              >
                View Certificate
              </Button>
            </Link>
          )}

          {isPassed && certificateNumber && (
            <Link to={`/verify-certificate/${certificateNumber}`}>
              <Button
                variant="outline"
                size="md"
                leftIcon={<ExternalLink className="w-4 h-4" />}
                className="border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Verify Credential
              </Button>
            </Link>
          )}

          {courseId && (
            <Link to={`/learn/${courseId}`}>
              <Button
                variant={isPassed ? 'outline' : 'outline'}
                size="md"
                leftIcon={<BookOpen className="w-4 h-4" />}
                className={isPassed ? 'border-teal-300 text-teal-800 hover:bg-teal-50' : ''}
              >
                {isPassed ? 'Continue Learning' : 'Back to Course'}
              </Button>
            </Link>
          )}

          {!isPassed && canRetake && onRetake && (
            <Button
              variant="primary"
              size="md"
              onClick={onRetake}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="bg-teal-700 hover:bg-teal-800"
            >
              Retake Assessment
            </Button>
          )}

          <Link to="/assessments">
            <Button
              variant="ghost"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              All Assessments
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

ResultSummary.propTypes = {
  resultData: PropTypes.shape({
    assessment: PropTypes.object,
    attemptNumber: PropTypes.number,
    totalMarks: PropTypes.number,
    obtainedMarks: PropTypes.number,
    percentage: PropTypes.number,
    result: PropTypes.string,
    evaluatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  onRetake: PropTypes.func,
  canRetake: PropTypes.bool,
  remainingAttempts: PropTypes.number,
};

export default ResultSummary;
