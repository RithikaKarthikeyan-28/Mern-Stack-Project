import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const QuestionEditorModal = ({
  isOpen = false,
  question = null,
  defaultOrder = 1,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'single_choice',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
    ],
    correctAnswers: ['A'],
    marks: 1,
    order: 1,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(question);

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText || '',
        questionType: question.questionType || 'single_choice',
        options: question.options?.length
          ? question.options.map((o) => ({ key: o.key, text: o.text }))
          : [
              { key: 'A', text: '' },
              { key: 'B', text: '' },
            ],
        correctAnswers: question.correctAnswers || ['A'],
        marks: question.marks || 1,
        order: question.order || 1,
      });
    } else {
      setFormData({
        questionText: '',
        questionType: 'single_choice',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
        correctAnswers: ['A'],
        marks: 1,
        order: defaultOrder,
      });
    }
    setErrors({});
    setServerError('');
  }, [question, defaultOrder, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      questionType: newType,
      correctAnswers: [prev.options[0]?.key || 'A'],
    }));
  };

  const handleOptionTextChange = (index, text) => {
    const nextOptions = [...formData.options];
    nextOptions[index] = { ...nextOptions[index], text };
    setFormData({ ...formData, options: nextOptions });
  };

  const handleAddOption = () => {
    if (formData.options.length >= OPTION_KEYS.length) return;
    const nextKey = OPTION_KEYS[formData.options.length];
    setFormData({
      ...formData,
      options: [...formData.options, { key: nextKey, text: '' }],
    });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) return;
    const removedKey = formData.options[index].key;
    const nextOptions = formData.options
      .filter((_, idx) => idx !== index)
      .map((opt, idx) => ({ ...opt, key: OPTION_KEYS[idx] }));

    const nextCorrect = formData.correctAnswers
      .filter((k) => k !== removedKey)
      .map((k) => {
        // Re-map to new keys
        const oldIdx = OPTION_KEYS.indexOf(k);
        return oldIdx > index ? OPTION_KEYS[oldIdx - 1] : k;
      });

    setFormData({
      ...formData,
      options: nextOptions,
      correctAnswers: nextCorrect.length > 0 ? nextCorrect : [nextOptions[0].key],
    });
  };

  const handleToggleCorrect = (key) => {
    if (formData.questionType === 'single_choice') {
      setFormData({ ...formData, correctAnswers: [key] });
    } else {
      const exists = formData.correctAnswers.includes(key);
      if (exists) {
        if (formData.correctAnswers.length <= 1) return; // Keep at least one correct answer
        setFormData({
          ...formData,
          correctAnswers: formData.correctAnswers.filter((k) => k !== key),
        });
      } else {
        setFormData({
          ...formData,
          correctAnswers: [...formData.correctAnswers, key],
        });
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.questionText.trim() || formData.questionText.trim().length < 5) {
      errs.questionText = 'Question prompt must be at least 5 characters long';
    }
    if (formData.options.some((o) => !o.text.trim())) {
      errs.options = 'All option choices must have text';
    }
    if (formData.options.length < 2) {
      errs.options = 'A question must have at least 2 options';
    }
    if (!formData.correctAnswers.length) {
      errs.correctAnswers = 'At least one correct answer must be selected';
    }
    if (!formData.marks || Number(formData.marks) < 1) {
      errs.marks = 'Marks must be a positive integer';
    }
    if (!formData.order || Number(formData.order) < 1) {
      errs.order = 'Sequence order must be a positive integer';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      await onSubmit({
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        options: formData.options.map((o) => ({ key: o.key, text: o.text.trim() })),
        correctAnswers: formData.correctAnswers,
        marks: Number(formData.marks),
        order: Number(formData.order),
      });
      onClose();
    } catch (err) {
      setServerError(
        err.response?.data?.message || err.message || 'Failed to save question.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="question-modal-title"
            className="text-xl font-bold text-brand-ink-primary dark:text-white"
          >
            {isEditing ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="question-text"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Question Prompt *
            </label>
            <textarea
              id="question-text"
              rows={3}
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none ${
                errors.questionText
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder="Enter the question or problem statement..."
              disabled={isLoading}
            />
            {errors.questionText && (
              <p className="mt-1 text-xs text-red-600">{errors.questionText}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="question-type"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Question Type *
              </label>
              <select
                id="question-type"
                value={formData.questionType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="question-marks"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Marks *
              </label>
              <input
                id="question-marks"
                type="number"
                min={1}
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              />
              {errors.marks && <p className="mt-1 text-xs text-red-600">{errors.marks}</p>}
            </div>

            <div>
              <label
                htmlFor="question-order"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Sequence # *
              </label>
              <input
                id="question-order"
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                disabled={isLoading}
              />
              {errors.order && <p className="mt-1 text-xs text-red-600">{errors.order}</p>}
            </div>
          </div>

          {/* Options & Correct Answer Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Answer Options & Correct Key(s) *
              </label>
              {formData.options.length < OPTION_KEYS.length && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-teal-700 hover:text-teal-800 dark:text-teal-300 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </button>
              )}
            </div>

            {errors.options && <p className="text-xs text-red-600">{errors.options}</p>}
            {errors.correctAnswers && (
              <p className="text-xs text-red-600">{errors.correctAnswers}</p>
            )}

            <div className="space-y-2">
              {formData.options.map((option, idx) => {
                const isCorrect = formData.correctAnswers.includes(option.key);
                return (
                  <div
                    key={option.key}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border ${
                      isCorrect
                        ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCorrect(option.key)}
                      className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                      title={
                        isCorrect
                          ? 'Correct answer. Click to toggle.'
                          : 'Mark as correct answer'
                      }
                      aria-label={`Mark option ${option.key} as correct`}
                    >
                      {option.key}
                    </button>

                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-brand-ink-primary dark:text-white focus:ring-1 focus:ring-teal-600 focus:border-teal-600 focus:outline-none"
                      placeholder={`Option ${option.key} description...`}
                      disabled={isLoading}
                    />

                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        aria-label={`Remove option ${option.key}`}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Tip: Click the letter button (e.g. [A], [B]) to designate which option(s) are correct.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditorModal;
