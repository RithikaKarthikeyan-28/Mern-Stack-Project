import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { History, Eye, CheckCircle2, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const AttemptHistory = ({
  attempts = [],
  assessmentId = '',
  title = 'Attempt History',
  subtitle = 'Your previous submissions and grading results',
}) => {
  if (!attempts || attempts.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200/90" padding={false} data-testid="attempt-history-card">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102A2A]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <Badge variant="default" size="sm">
          {attempts.length} {attempts.length === 1 ? 'Attempt' : 'Attempts'}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-5 py-3.5">Attempt</th>
              <th scope="col" className="px-5 py-3.5">Score</th>
              <th scope="col" className="px-5 py-3.5">Percentage</th>
              <th scope="col" className="px-5 py-3.5">Result</th>
              <th scope="col" className="px-5 py-3.5">Date</th>
              <th scope="col" className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {attempts.map((att) => {
              const attemptId = att.attemptId || att.id || att._id;
              const targetAssessmentId = att.assessmentId || assessmentId;
              const isPassed = att.result === 'passed';
              const formattedDate = att.submittedAt || att.evaluatedAt
                ? new Date(att.submittedAt || att.evaluatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <tr key={`${attemptId}-${att.attemptNumber || 1}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    Attempt #{att.attemptNumber || 1}
                  </td>
                  <td className="px-5 py-3.5 font-medium">
                    {att.obtainedMarks != null && att.totalMarks != null
                      ? `${att.obtainedMarks} / ${att.totalMarks}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 font-bold">
                    <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                      {att.percentage != null ? `${att.percentage}%` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={isPassed ? 'success' : 'danger'}
                      size="sm"
                      className="font-medium"
                    >
                      {isPassed ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Passed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formattedDate}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {targetAssessmentId && attemptId ? (
                      <Link to={`/assessments/${targetAssessmentId}/result/${attemptId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                        >
                          View Result
                        </Button>
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

AttemptHistory.propTypes = {
  attempts: PropTypes.arrayOf(
    PropTypes.shape({
      attemptId: PropTypes.string,
      id: PropTypes.string,
      _id: PropTypes.string,
      attemptNumber: PropTypes.number,
      obtainedMarks: PropTypes.number,
      totalMarks: PropTypes.number,
      percentage: PropTypes.number,
      result: PropTypes.string,
      submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      evaluatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })
  ),
  assessmentId: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default AttemptHistory;
