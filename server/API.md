# SKILLTRACK — Backend REST API Specification

**Employee Learning, Skill Development and Compliance Management Platform**  
*API Version: 1.0.0 | Format: RESTful JSON*

---

## 1. Global Conventions & Standards

### Base URL
```text
http://localhost:5000/api
```

### Authentication Header
Protected endpoints require a standard Bearer token in the `Authorization` header:
```text
Authorization: Bearer <jwt_token>
```

### Standard Response Envelope

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Common HTTP Status Codes
| Code | Meaning | Description |
| :---: | :--- | :--- |
| **200** | OK | Request succeeded. |
| **201** | Created | Resource successfully created. |
| **400** | Bad Request | Validation error, malformed input, or NoSQL operator detected. |
| **401** | Unauthorized | Missing, expired, or invalid JWT authentication token. |
| **403** | Forbidden | User lacks necessary RBAC permissions or tenancy rights. |
| **404** | Not Found | Resource not found or anti-enumeration defense. |
| **409** | Conflict | Duplicate unique resource (e.g. email, code, enrollment). |
| **413** | Payload Too Large | Request body exceeds configured `BODY_LIMIT` (10kb). |
| **429** | Too Many Requests | Rate limit threshold exceeded. |
| **500** | Internal Server Error | Unexpected server error (masked in production). |
| **503** | Service Unavailable | Service or dependent database is not ready. |

---

## 2. Health & Readiness Probes

### 2.1 Liveness Probe
- **Method / Route:** `GET /api/health`
- **Auth:** Public (Unauthenticated)
- **Roles:** All
- **Purpose:** Verifies that the Express application process is alive and responsive.
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "SkillTrack API is running"
  }
  ```

### 2.2 Readiness Probe
- **Method / Route:** `GET /api/ready`
- **Auth:** Public (Unauthenticated)
- **Roles:** All
- **Purpose:** Verifies that the server and dependent MongoDB database connection are ready to handle requests.
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "SkillTrack API is ready",
    "data": {
      "status": "ready",
      "database": "connected"
    }
  }
  ```
- **Error (503 Service Unavailable):**
  ```json
  {
    "success": false,
    "message": "SkillTrack API is not ready",
    "data": {
      "status": "not_ready",
      "database": "disconnected"
    }
  }
  ```

---

## 3. Authentication Module

### 3.1 Register User
- **Method / Route:** `POST /api/auth/register`
- **Auth:** Public
- **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "employee"
  }
  ```
- **Success (201):** User object with `token` and `user` profile (excluding `password`).
- **Errors:** 400 (validation fail), 409 (email already registered), 429 (rate limited).

### 3.2 Login User
- **Method / Route:** `POST /api/auth/login`
- **Auth:** Public
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success (200):** Returns JWT token and sanitized user details.
- **Errors:** 400 (missing fields), 401 (invalid credentials), 429 (rate limited).

### 3.3 Get Current User Profile
- **Method / Route:** `GET /api/auth/me`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`, `employee`
- **Success (200):** Authenticated user record.

---

## 4. Departments Module

### 4.1 Create Department
- **Method / Route:** `POST /api/departments`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "name": "Engineering", "code": "ENG", "description": "Software Engineering" }`
- **Success (201):** Created department object.

### 4.2 List Departments
- **Method / Route:** `GET /api/departments`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`, `employee`
- **Success (200):** Array of active departments.

### 4.3 Get Department by ID
- **Method / Route:** `GET /api/departments/:id`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`, `employee`

### 4.4 Update Department
- **Method / Route:** `PATCH /api/departments/:id`
- **Auth:** Bearer Token
- **Roles:** `admin`

### 4.5 Delete Department (Soft Delete)
- **Method / Route:** `DELETE /api/departments/:id`
- **Auth:** Bearer Token
- **Roles:** `admin`

---

## 5. Employees Module

### 5.1 Create Employee Profile
- **Method / Route:** `POST /api/employees`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:**
  ```json
  {
    "user": "<userId>",
    "department": "<departmentId>",
    "employeeId": "EMP-001",
    "designation": "Software Engineer",
    "phone": "1234567890",
    "dateOfJoining": "2026-01-15T00:00:00.000Z"
  }
  ```
- **Success (201):** Created employee profile.

### 5.2 Get My Employee Profile
- **Method / Route:** `GET /api/employees/me`
- **Auth:** Bearer Token
- **Roles:** `employee`, `trainer`, `admin`
- **Success (200):** Current user's linked employee document.

### 5.3 List Employees
- **Method / Route:** `GET /api/employees`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Query:** `?department=<id>&page=1&limit=20`

### 5.4 Get Employee by ID
- **Method / Route:** `GET /api/employees/:id`
- **Auth:** Bearer Token
- **Roles:** `admin`

---

## 6. Courses, Modules & Lessons

### 6.1 Create Course
- **Method / Route:** `POST /api/courses`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`
- **Body:** `{ "title": "Node.js Core", "description": "Backend course", "category": "Engineering", "level": "intermediate" }`

### 6.2 Update Course
- **Method / Route:** `PATCH /api/courses/:id`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer` (own courses only)

### 6.3 List Courses
- **Method / Route:** `GET /api/courses`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`, `employee`
- **Note:** Employees only receive published courses (`status: "published"`).

### 6.4 Create Module
- **Method / Route:** `POST /api/modules`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer` (own courses only)
- **Body:** `{ "course": "<courseId>", "title": "Module 1", "order": 1 }`

### 6.5 Add Lesson to Module
- **Method / Route:** `POST /api/modules/:moduleId/lessons`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`
- **Body:** `{ "title": "Lesson 1", "content": "Text content", "duration": 15, "order": 1 }`

---

## 7. Enrollments & Learning Progression

### 7.1 Self-Enroll in Course
- **Method / Route:** `POST /api/enrollments`
- **Auth:** Bearer Token
- **Roles:** `employee`
- **Body:** `{ "courseId": "<courseId>" }`
- **Success (201):** Enrollment record initialized at `progressPercentage: 0`, `status: "in_progress"`.
- **Errors:** 409 (already enrolled), 400 (course not published).

### 7.2 Get My Enrollments
- **Method / Route:** `GET /api/enrollments/me`
- **Auth:** Bearer Token
- **Roles:** `employee`

### 7.3 Update Lesson Progress
- **Method / Route:** `PATCH /api/enrollments/:id/progress`
- **Auth:** Bearer Token
- **Roles:** `employee` (own enrollment only)
- **Body:** `{ "lessonId": "<lessonId>", "completed": true }`
- **Note:** Server deterministically computes progress percentage. Direct client attempts to inject `progressPercentage` are rejected with HTTP 400.

---

## 8. Assessments, Attempts & Results

### 8.1 Create Assessment
- **Method / Route:** `POST /api/assessments`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`
- **Body:** `{ "course": "<courseId>", "title": "Final Exam", "passingScore": 70 }`

### 8.2 Add Question
- **Method / Route:** `POST /api/assessments/:id/questions`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`
- **Body:**
  ```json
  {
    "text": "What does HTTP stand for?",
    "type": "single_choice",
    "options": ["HyperText Transfer Protocol", "High Text Protocol"],
    "correctAnswer": [0],
    "marks": 2
  }
  ```

### 8.3 Publish Assessment
- **Method / Route:** `PATCH /api/assessments/:id/publish`
- **Auth:** Bearer Token
- **Roles:** `admin`, `trainer`

### 8.4 Start Assessment Attempt
- **Method / Route:** `POST /api/assessments/:id/attempts`
- **Auth:** Bearer Token
- **Roles:** `employee`
- **Success (201):** Attempt instance with question options without correct answers.

### 8.5 Submit Assessment Answers
- **Method / Route:** `POST /api/attempts/:id/submit`
- **Auth:** Bearer Token
- **Roles:** `employee` (own attempt only)
- **Body:** `{ "answers": [{ "questionId": "<qId>", "selectedOptions": [0] }] }`
- **Success (200):** Deterministic grading result (`passed` / `failed`, percentage, score).

---

## 9. Certificates & Expiry / Renewal

### 9.1 Issue Certificate
- **Method / Route:** `POST /api/certificates`
- **Auth:** Bearer Token
- **Roles:** `employee` (self-issuance upon passing)
- **Body:** `{ "enrollmentId": "<enrollmentId>" }`
- **Note:** Idempotent (returns existing active certificate if already issued). Client cannot inject certificate numbers or expiry dates.

### 9.2 Public Certificate Verification
- **Method / Route:** `GET /api/certificates/verify/:certificateNumber`
- **Auth:** Public (Unauthenticated)
- **Success (200):** Certificate verification status, recipient name, course title, issue and expiry dates.

### 9.3 Renew Certificate
- **Method / Route:** `POST /api/certificates/:id/renew`
- **Auth:** Bearer Token
- **Roles:** `employee`
- **Success (201):** Child certificate chained via `renewedFrom`. Allowed only within the 30-day renewal window.

---

## 10. In-App Notifications

### 10.1 List Notifications
- **Method / Route:** `GET /api/notifications`
- **Auth:** Bearer Token
- **Roles:** `employee`, `trainer`, `admin`
- **Query:** `?isRead=false&page=1&limit=20`

### 10.2 Mark Notification as Read
- **Method / Route:** `PATCH /api/notifications/:id/read`
- **Auth:** Bearer Token
- **Roles:** Recipient only

### 10.3 Process Expiries (Background Maintenance)
- **Method / Route:** `POST /api/notifications/process-expiries`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Purpose:** Idempotently scans expiring certificates and dispatches in-app notifications.

---

## 11. Skills & Job Role Requirements

### 11.1 Create Skill
- **Method / Route:** `POST /api/skills`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "name": "Node.js", "code": "SKILL-NODE-01", "category": "Backend" }`

### 11.2 Create Job Role
- **Method / Route:** `POST /api/job-roles`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "name": "Senior Software Architect", "code": "ROLE-SSA-01", "department": "<deptId>" }`

### 11.3 Add Skill Requirement to Job Role
- **Method / Route:** `POST /api/job-roles/:id/requirements`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "skill": "<skillId>", "requiredLevel": "advanced", "mandatory": true, "weight": 3 }`

### 11.4 Assign Employee Skill Proficiency
- **Method / Route:** `POST /api/employees/:id/skills`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "skill": "<skillId>", "proficiencyLevel": "intermediate" }`

---

## 12. Skill Gap Analysis & Recommendations

### 12.1 Employee Self Skill Gap Report
- **Method / Route:** `GET /api/employees/me/skill-gap/:jobRoleId`
- **Auth:** Bearer Token
- **Roles:** `employee`
- **Success (200):** Breakdown of `MEETS_REQUIRED`, `BELOW_REQUIRED`, and `MISSING` skills with summary match percentages.

### 12.2 Course Recommendations for Gap Skills
- **Method / Route:** `GET /api/employees/me/recommendations/:jobRoleId`
- **Auth:** Bearer Token
- **Roles:** `employee`
- **Success (200):** Ranked list of courses closing employee gaps, including breadth and mandatory bonuses.

---

## 13. Compliance Management

### 13.1 Create Compliance Requirement
- **Method / Route:** `POST /api/compliance-requirements`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "title": "Data Privacy 2026", "code": "COMP-DP-26", "course": "<courseId>", "dueInDays": 30 }`

### 13.2 Assign Compliance Requirement
- **Method / Route:** `POST /api/compliance-requirements/:id/assignments`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Body:** `{ "employee": "<employeeId>", "dueAt": "2026-11-15T00:00:00.000Z" }`

### 13.3 Organizational Compliance Summary
- **Method / Route:** `GET /api/compliance/summary`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Success (200):** Aggregated metrics: total assignments, compliant, due soon, overdue, compliance percentage.

---

## 14. Analytics & Reporting APIs

### 14.1 Overview Analytics
- **Method / Route:** `GET /api/analytics/overview`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Success (200):** Platform summary counts across employees, departments, courses, enrollments, assessments, certificates, and compliance.

### 14.2 Learning Domain Analytics
- **Method / Route:** `GET /api/analytics/learning`
- **Auth:** Bearer Token
- **Roles:** `admin`
- **Query:** `?startDate=...&endDate=...`

### 14.3 Assessment Domain Analytics
- **Method / Route:** `GET /api/analytics/assessments`
- **Auth:** Bearer Token
- **Roles:** `admin`

### 14.4 Compliance Domain Analytics
- **Method / Route:** `GET /api/analytics/compliance`
- **Auth:** Bearer Token
- **Roles:** `admin`

### 14.5 Certification Domain Analytics
- **Method / Route:** `GET /api/analytics/certifications`
- **Auth:** Bearer Token
- **Roles:** `admin`
