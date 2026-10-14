const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { ASSESSMENT_STATUSES } = require('../models/Assessment');
const { QUESTION_TYPES } = require('../models/Question');
const { validateObjectId } = require('./department.validator');

/**
 * Validates payload for creating an assessment.
 *
 * @param {object} data - Assessment creation payload
 * @param {boolean} [isTrainer=false] - Whether the authenticated user is a trainer
 * @throws {AppError} When validation fails
 */
function validateCreateAssessment(data, isTrainer = false) {
  const errors = [];
  const {
    title,
    description,
    course,
    module: moduleId,
    trainer,
    passingPercentage,
    timeLimitMinutes,
    maxAttempts,
    status
  } = data || {};

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Assessment title is required');
  } else if (title.trim().length < 3) {
    errors.push('Assessment title must be at least 3 characters long');
  } else if (title.trim().length > 200) {
    errors.push('Assessment title cannot exceed 200 characters');
  }

  // Description validation
  if (description !== undefined && typeof description === 'string' && description.length > 2000) {
    errors.push('Assessment description cannot exceed 2000 characters');
  }

  // Course reference validation
  if (!course) {
    errors.push('Course reference is required');
  } else if (!mongoose.Types.ObjectId.isValid(course)) {
    errors.push('Invalid Course ID format');
  }

  // Module reference validation (optional)
  if (moduleId !== undefined && moduleId !== null && !mongoose.Types.ObjectId.isValid(moduleId)) {
    errors.push('Invalid Module ID format');
  }

  // Trainer reference validation for admin
  if (!isTrainer && trainer !== undefined && !mongoose.Types.ObjectId.isValid(trainer)) {
    errors.push('Invalid Trainer ID format');
  }

  // Passing percentage validation
  if (passingPercentage !== undefined && passingPercentage !== null) {
    if (typeof passingPercentage !== 'number' || passingPercentage < 0 || passingPercentage > 100) {
      errors.push('Passing percentage must be a number between 0 and 100');
    }
  }

  // Time limit validation
  if (timeLimitMinutes !== undefined && timeLimitMinutes !== null) {
    if (
      typeof timeLimitMinutes !== 'number' ||
      !Number.isInteger(timeLimitMinutes) ||
      timeLimitMinutes < 1
    ) {
      errors.push('Time limit must be a positive integer of at least 1 minute');
    }
  }

  // Max attempts validation
  if (maxAttempts !== undefined && maxAttempts !== null) {
    if (typeof maxAttempts !== 'number' || !Number.isInteger(maxAttempts) || maxAttempts < 1) {
      errors.push('Max attempts must be a positive integer of at least 1');
    }
  }

  // Status validation
  if (status !== undefined && !ASSESSMENT_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${ASSESSMENT_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating an assessment.
 *
 * @param {object} data - Assessment update payload
 * @throws {AppError} When validation fails
 */
function validateUpdateAssessment(data) {
  const errors = [];
  const {
    title,
    description,
    course,
    module: moduleId,
    passingPercentage,
    timeLimitMinutes,
    maxAttempts,
    status
  } = data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  // Course cannot be changed
  if (course !== undefined) {
    errors.push('Course reference cannot be changed once created');
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Assessment title cannot be empty');
    } else if (title.trim().length < 3) {
      errors.push('Assessment title must be at least 3 characters long');
    } else if (title.trim().length > 200) {
      errors.push('Assessment title cannot exceed 200 characters');
    }
  }

  if (description !== undefined && typeof description === 'string' && description.length > 2000) {
    errors.push('Assessment description cannot exceed 2000 characters');
  }

  if (moduleId !== undefined && moduleId !== null && !mongoose.Types.ObjectId.isValid(moduleId)) {
    errors.push('Invalid Module ID format');
  }

  if (passingPercentage !== undefined && passingPercentage !== null) {
    if (typeof passingPercentage !== 'number' || passingPercentage < 0 || passingPercentage > 100) {
      errors.push('Passing percentage must be a number between 0 and 100');
    }
  }

  if (timeLimitMinutes !== undefined && timeLimitMinutes !== null) {
    if (
      typeof timeLimitMinutes !== 'number' ||
      !Number.isInteger(timeLimitMinutes) ||
      timeLimitMinutes < 1
    ) {
      errors.push('Time limit must be a positive integer of at least 1 minute');
    }
  }

  if (maxAttempts !== undefined && maxAttempts !== null) {
    if (typeof maxAttempts !== 'number' || !Number.isInteger(maxAttempts) || maxAttempts < 1) {
      errors.push('Max attempts must be a positive integer of at least 1');
    }
  }

  if (status !== undefined && !ASSESSMENT_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${ASSESSMENT_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for creating a question.
 *
 * @param {object} data - Question creation payload
 * @throws {AppError} When validation fails
 */
function validateCreateQuestion(data) {
  const errors = [];
  const { assessment, questionText, questionType, options, correctAnswers, marks, order } =
    data || {};

  if (!assessment) {
    errors.push('Assessment reference is required');
  } else if (!mongoose.Types.ObjectId.isValid(assessment)) {
    errors.push('Invalid Assessment ID format');
  }

  if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
    errors.push('Question text is required');
  } else if (questionText.trim().length < 5) {
    errors.push('Question text must be at least 5 characters long');
  } else if (questionText.trim().length > 2000) {
    errors.push('Question text cannot exceed 2000 characters');
  }

  const effectiveType = questionType || 'single_choice';
  if (!QUESTION_TYPES.includes(effectiveType)) {
    errors.push(`Question type must be one of: ${QUESTION_TYPES.join(', ')}`);
  }

  // Options validation
  if (!options || !Array.isArray(options) || options.length < 2) {
    errors.push('A question must have at least 2 options');
  } else {
    const keysSeen = new Set();
    options.forEach((opt, idx) => {
      if (!opt.key || typeof opt.key !== 'string' || opt.key.trim().length === 0) {
        errors.push(`Option at index ${idx} is missing a valid key`);
      } else {
        const trimmedKey = opt.key.trim();
        if (keysSeen.has(trimmedKey)) {
          errors.push(`Duplicate option key "${trimmedKey}" detected`);
        }
        keysSeen.add(trimmedKey);
      }
      if (!opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
        errors.push(`Option at index ${idx} is missing text`);
      }
    });

    // Correct answers validation
    if (!correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length === 0) {
      errors.push('At least one correct answer is required');
    } else {
      const answersSet = new Set(correctAnswers);
      if (answersSet.size !== correctAnswers.length) {
        errors.push('Duplicate correct answers are not allowed');
      }

      if (effectiveType === 'single_choice' && correctAnswers.length !== 1) {
        errors.push('Single choice questions must have exactly one correct answer');
      }

      if (effectiveType === 'multiple_choice' && correctAnswers.length < 1) {
        errors.push('Multiple choice questions must have at least one correct answer');
      }

      correctAnswers.forEach((ans) => {
        if (!keysSeen.has(ans)) {
          errors.push(`Correct answer "${ans}" does not match any valid option key`);
        }
      });
    }
  }

  if (marks === undefined || marks === null) {
    errors.push('Marks are required');
  } else if (typeof marks !== 'number' || !Number.isInteger(marks) || marks < 1) {
    errors.push('Marks must be a positive integer');
  }

  if (order === undefined || order === null) {
    errors.push('Order is required');
  } else if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
    errors.push('Order must be a positive integer');
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for updating a question.
 *
 * @param {object} data - Question update payload
 * @throws {AppError} When validation fails
 */
function validateUpdateQuestion(data) {
  const errors = [];
  const { assessment, questionText, questionType, options, correctAnswers, marks, order } =
    data || {};

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('At least one field must be provided for update', 400);
  }

  if (assessment !== undefined) {
    errors.push('Assessment reference cannot be changed once created');
  }

  if (questionText !== undefined) {
    if (typeof questionText !== 'string' || questionText.trim().length === 0) {
      errors.push('Question text cannot be empty');
    } else if (questionText.trim().length < 5) {
      errors.push('Question text must be at least 5 characters long');
    } else if (questionText.trim().length > 2000) {
      errors.push('Question text cannot exceed 2000 characters');
    }
  }

  if (questionType !== undefined && !QUESTION_TYPES.includes(questionType)) {
    errors.push(`Question type must be one of: ${QUESTION_TYPES.join(', ')}`);
  }

  if (options !== undefined) {
    if (!Array.isArray(options) || options.length < 2) {
      errors.push('A question must have at least 2 options');
    } else {
      const keysSeen = new Set();
      options.forEach((opt, idx) => {
        if (!opt.key || typeof opt.key !== 'string' || opt.key.trim().length === 0) {
          errors.push(`Option at index ${idx} is missing a valid key`);
        } else {
          const trimmedKey = opt.key.trim();
          if (keysSeen.has(trimmedKey)) {
            errors.push(`Duplicate option key "${trimmedKey}" detected`);
          }
          keysSeen.add(trimmedKey);
        }
        if (!opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
          errors.push(`Option at index ${idx} is missing text`);
        }
      });
    }
  }

  if (correctAnswers !== undefined) {
    if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
      errors.push('At least one correct answer is required');
    } else {
      const answersSet = new Set(correctAnswers);
      if (answersSet.size !== correctAnswers.length) {
        errors.push('Duplicate correct answers are not allowed');
      }
    }
  }

  if (marks !== undefined) {
    if (typeof marks !== 'number' || !Number.isInteger(marks) || marks < 1) {
      errors.push('Marks must be a positive integer');
    }
  }

  if (order !== undefined) {
    if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
      errors.push('Order must be a positive integer');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

/**
 * Validates payload for submitting an attempt.
 *
 * @param {object} data - Attempt submission payload
 * @throws {AppError} When validation fails
 */
function validateSubmitAttempt(data) {
  const errors = [];
  const {
    answers,
    score,
    status,
    attemptNumber,
    startedAt,
    submittedAt,
    employee,
    enrollment,
    assessment,
    totalMarks,
    obtainedMarks,
    percentage,
    result,
    evaluatedAt
  } = data || {};

  // Reject injected server-managed properties
  if (score !== undefined) errors.push('Direct score submission is not allowed');
  if (status !== undefined) errors.push('Direct status submission is not allowed');
  if (attemptNumber !== undefined) errors.push('Direct attemptNumber submission is not allowed');
  if (startedAt !== undefined) errors.push('Direct startedAt submission is not allowed');
  if (submittedAt !== undefined) errors.push('Direct submittedAt submission is not allowed');
  if (employee !== undefined) errors.push('Direct employee submission is not allowed');
  if (enrollment !== undefined) errors.push('Direct enrollment submission is not allowed');
  if (assessment !== undefined) errors.push('Direct assessment submission is not allowed');
  if (totalMarks !== undefined) errors.push('Direct totalMarks submission is not allowed');
  if (obtainedMarks !== undefined) errors.push('Direct obtainedMarks submission is not allowed');
  if (percentage !== undefined) errors.push('Direct percentage submission is not allowed');
  if (result !== undefined) errors.push('Direct result submission is not allowed');
  if (evaluatedAt !== undefined) errors.push('Direct evaluatedAt submission is not allowed');

  if (!answers || !Array.isArray(answers)) {
    errors.push('Answers must be provided as an array');
  } else {
    const questionSeen = new Set();
    answers.forEach((ans, idx) => {
      if (!ans.question || !mongoose.Types.ObjectId.isValid(ans.question)) {
        errors.push(`Answer at index ${idx} must have a valid question ObjectId`);
      } else {
        const qIdStr = ans.question.toString();
        if (questionSeen.has(qIdStr)) {
          errors.push(`Duplicate question entry for question ID ${qIdStr}`);
        }
        questionSeen.add(qIdStr);
      }

      if (!ans.selectedAnswers || !Array.isArray(ans.selectedAnswers) || ans.selectedAnswers.length === 0) {
        errors.push(`Answer at index ${idx} must contain selectedAnswers as a non-empty array`);
      } else {
        const nonStrings = ans.selectedAnswers.filter((a) => typeof a !== 'string' || !a.trim());
        if (nonStrings.length > 0) {
          errors.push(`Answer at index ${idx} selectedAnswers must be strings`);
        }
        const selSet = new Set(ans.selectedAnswers);
        if (selSet.size !== ans.selectedAnswers.length) {
          errors.push(`Answer at index ${idx} contains duplicate selected answers`);
        }
      }
    });
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, errors);
  }
}

module.exports = {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateSubmitAttempt,
  validateObjectId
};
