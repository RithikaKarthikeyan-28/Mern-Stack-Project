/**
 * 10 Mandated Technical Courses with Modules and Comprehensive Educational Lessons.
 */

const courseData = [
  {
    title: 'Java Programming Fundamentals',
    description:
      'Master the core foundations of the Java programming language. Learn JVM architecture, syntax, data types, control flow structures, methods, arrays, and standard libraries required to build robust enterprise-grade applications.',
    category: 'Programming',
    level: 'beginner',
    duration: 16,
    matchingAssessmentTitle: 'Java Fundamentals',
    modules: [
      {
        order: 1,
        title: 'Java Platform & Core Syntax',
        description: 'Understand the JVM, JDK, bytecode compilation, primitives, variables, and operators.',
        lessons: [
          {
            order: 1,
            title: 'JVM Architecture, Compilation, and Execution',
            contentType: 'text',
            content: `## Java Platform Architecture

Java is a platform-independent, object-oriented language that follows the "Write Once, Run Anywhere" (WORA) philosophy.

### Key Components:
1. **JDK (Java Development Kit)**: Contains the tools needed to write, compile, and run Java code (javac compiler, debugger, standard libraries).
2. **JRE (Java Runtime Environment)**: Provides the libraries and resources needed to execute Java bytecode.
3. **JVM (Java Virtual Machine)**: The abstract computing machine that executes compiled Java bytecode (\`.class\` files).

### Compilation Pipeline:
\`\`\`
Source Code (.java) -> javac Compiler -> Bytecode (.class) -> JVM (Interpreter + JIT Compiler) -> Machine Code
\`\`\`

### Example: A Minimal Java Application
\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Welcome to Java Programming Fundamentals!");
    }
}
\`\`\`

#### Key Concept Check:
- What makes Java portable across operating systems?
- The bytecode produced by \`javac\` runs on any platform with a compatible JVM implementation.`
          },
          {
            order: 2,
            title: 'Data Types, Variables, and Operators',
            contentType: 'text',
            content: `## Data Types and Variables in Java

Java is a strongly typed language. Every variable must have a declared type before it can be used.

### Primitive Data Types:
- **Integer types**: \`byte\` (8-bit), \`short\` (16-bit), \`int\` (32-bit), \`long\` (64-bit)
- **Floating-point**: \`float\` (32-bit IEEE 754), \`double\` (64-bit IEEE 754)
- **Character**: \`char\` (16-bit Unicode)
- **Boolean**: \`boolean\` (\`true\` or \`false\`)

### Variable Declaration & Type Casting:
\`\`\`java
int studentCount = 45;
double courseFee = 199.99;
char grade = 'A';
boolean isEnrolled = true;

// Implicit Widening Casting:
double convertedCount = studentCount;

// Explicit Narrowing Casting (requires explicit cast):
int roundedFee = (int) courseFee;
\`\`\`

### Exercise:
Write a method that converts Celsius to Fahrenheit using the formula: \`F = (C * 9/5) + 32\`. Make sure to use appropriate floating-point literals (\`9.0 / 5.0\`) to avoid integer truncation.`
          }
        ]
      },
      {
        order: 2,
        title: 'Control Flow, Arrays & Methods',
        description: 'Implement conditional branches, iterative loops, multidimensional arrays, and reusable modular methods.',
        lessons: [
          {
            order: 1,
            title: 'Conditional Statements and Loops',
            contentType: 'text',
            content: `## Control Structures in Java

Control structures determine the flow of execution based on logical conditions.

### 1. Conditional Branching
\`\`\`java
int score = 82;
if (score >= 90) {
    System.out.println("Grade: A");
} else if (score >= 70) {
    System.out.println("Grade: B (Passing)");
} else {
    System.out.println("Grade: F (Needs Retake)");
}
\`\`\`

### 2. Enhanced For-Loop with Arrays
\`\`\`java
int[] examScores = { 88, 92, 79, 95, 84 };
int sum = 0;

for (int currentScore : examScores) {
    sum += currentScore;
}
double average = (double) sum / examScores.length;
System.out.println("Class average: " + average);
\`\`\`

### Best Practice:
Always bounds-check array indexing to prevent \`ArrayIndexOutOfBoundsException\`.`
          },
          {
            order: 2,
            title: 'Method Signatures, Scope, and Overloading',
            contentType: 'text',
            content: `## Designing Reusable Methods

In Java, methods encapsulate reusable computation and enforce access boundaries.

### Method Overloading:
Multiple methods can share the same name within a class if their parameter lists differ in type, number, or order (return type alone does NOT distinguish overloads).

\`\`\`java
public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }

    public static double add(double a, double b) {
        return a + b;
    }

    public static int add(int[] numbers) {
        int total = 0;
        for (int n : numbers) total += n;
        return total;
    }
}
\`\`\`

### Parameter Passing:
Java is strictly **Pass-by-Value**. For object references, the value of the reference (memory address) is passed by value.`
          }
        ]
      }
    ]
  },
  {
    title: 'Object-Oriented Programming',
    description:
      'Deep dive into the 4 pillars of Object-Oriented Programming (OOP) — Encapsulation, Inheritance, Polymorphism, and Abstraction. Learn design patterns, clean class hierarchies, interfaces, and composition over inheritance.',
    category: 'Software Engineering',
    level: 'intermediate',
    duration: 18,
    matchingAssessmentTitle: 'Object-Oriented Programming',
    modules: [
      {
        order: 1,
        title: 'Encapsulation & Class Design',
        description: 'Understand classes, objects, state encapsulation, access modifiers, and constructors.',
        lessons: [
          {
            order: 1,
            title: 'Encapsulation, Data Hiding, and Access Modifiers',
            contentType: 'text',
            content: `## Principles of Encapsulation

Encapsulation bundles data (attributes) and methods operating on that data within a single cohesive unit, while restricting unauthorized direct external modification.

### Access Modifiers:
- \`private\`: Visible only inside the defining class.
- \`default\` (package-private): Visible only within classes in the same package.
- \`protected\`: Visible within the same package and subclasses in other packages.
- \`public\`: Accessible everywhere.

### Encapsulated Class Example:
\`\`\`java
public class BankAccount {
    private final String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative");
        }
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Deposit amount must be positive");
        this.balance += amount;
    }

    public double getBalance() {
        return balance;
    }
}
\`\`\``
          },
          {
            order: 2,
            title: 'Constructors, Immutability, and Memory Model',
            contentType: 'text',
            content: `## Object Construction and Immutability

Constructors initialize newly instantiated object instances on the Heap.

### Constructor Chaining using \`this()\`:
\`\`\`java
public class Employee {
    private String id;
    private String name;
    private String role;

    public Employee(String id, String name) {
        this(id, name, "Software Engineer");
    }

    public Employee(String id, String name, String role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }
}
\`\`\`

### Immutability Checklist:
1. Declare the class \`final\` so it cannot be subclassed.
2. Mark all fields \`private\` and \`final\`.
3. Provide no setters or mutating methods.
4. If fields reference mutable objects, return defensive deep copies in getters.`
          }
        ]
      },
      {
        order: 2,
        title: 'Inheritance, Polymorphism & Abstraction',
        description: 'Model real-world domains using abstract classes, interfaces, method overriding, and dynamic dispatch.',
        lessons: [
          {
            order: 1,
            title: 'Inheritance & Dynamic Method Dispatch',
            contentType: 'text',
            content: `## Inheritance & Polymorphism

Polymorphism allows subclasses to define custom behaviors while sharing a uniform parent interface.

### The \`super\` Keyword & Method Overriding:
\`\`\`java
public abstract class Shape {
    private final String color;

    public Shape(String color) {
        this.color = color;
    }

    public abstract double calculateArea();
}

public class Circle extends Shape {
    private final double radius;

    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
}
\`\`\`

### Runtime Dynamic Dispatch:
When calling \`shape.calculateArea()\`, the JVM resolves the method body based on the actual runtime instance on the heap, not the compile-time variable reference.`
          },
          {
            order: 2,
            title: 'Interfaces vs Abstract Classes & Composition',
            contentType: 'text',
            content: `## Abstract Classes vs. Interfaces

### When to use an Interface:
- To define a contract for what a class does, regardless of where it belongs in a class hierarchy.
- A class can implement multiple interfaces, overcoming single inheritance limitations.

### Composition Over Inheritance:
Favoring composition creates loosely coupled systems where classes delegate behavior to member components rather than inheriting monolithic state.

\`\`\`java
public interface PaymentGateway {
    boolean processPayment(double amount);
}

public class OrderService {
    private final PaymentGateway paymentGateway;

    // Injected via constructor (Dependency Injection)
    public OrderService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }
}
\`\`\``
          }
        ]
      }
    ]
  },
  {
    title: 'Data Structures and Algorithms',
    description:
      'Master essential computer science data structures and algorithmic paradigms. Learn asymptotic Big-O analysis, linked lists, stacks, queues, trees, graphs, sorting, searching, and recursion.',
    category: 'Computer Science',
    level: 'intermediate',
    duration: 24,
    matchingAssessmentTitle: 'Data Structures and Algorithms',
    modules: [
      {
        order: 1,
        title: 'Asymptotic Analysis & Linear Data Structures',
        description: 'Big-O notation, arrays, dynamic arrays, linked lists, stacks, and queues.',
        lessons: [
          {
            order: 1,
            title: 'Asymptotic Time and Space Complexity (Big-O)',
            contentType: 'text',
            content: `## Understanding Big-O Asymptotic Complexity

Big-O notation characterizes the growth rate of runtime or space usage as the input size $n$ approaches infinity.

### Common Complexity Classes:
1. **$O(1)$ Constant Time**: Array index lookup, push/pop on stack.
2. **$O(\\log n)$ Logarithmic Time**: Binary search in a sorted array.
3. **$O(n)$ Linear Time**: Iterating through an unsorted array.
4. **$O(n \\log n)$ Linearithmic Time**: Merge Sort, Quick Sort (average).
5. **$O(n^2)$ Quadratic Time**: Nested loops over $n$ elements (Bubble Sort).
6. **$O(2^n)$ Exponential Time**: Naive recursive Fibonacci computation.

### Space Complexity:
Always account for auxiliary memory and recursive call stack depth in algorithmic evaluations.`
          },
          {
            order: 2,
            title: 'Singly and Doubly Linked Lists',
            contentType: 'text',
            content: `## Linked List Implementation & Mechanics

Unlike arrays which require contiguous memory, linked lists allocate individual nodes scattered throughout memory linked by pointers.

### Singly Linked Node Structure:
\`\`\`java
public class Node<T> {
    public T data;
    public Node<T> next;

    public Node(T data) {
        this.data = data;
        this.next = null;
    }
}
\`\`\`

### Time Complexity Comparison:
- **Prepend (Insert at head)**: $O(1)$ for Linked List vs $O(n)$ for Array.
- **Random Access by Index**: $O(n)$ for Linked List vs $O(1)$ for Array.
- **Append (with tail pointer)**: $O(1)$.`
          }
        ]
      },
      {
        order: 2,
        title: 'Non-Linear Structures, Trees & Sorting',
        description: 'Binary Search Trees (BST), Graph representations, Breadth-First and Depth-First Search, and Quick/Merge Sort.',
        lessons: [
          {
            order: 1,
            title: 'Binary Search Trees (BST) & Traversal Algorithms',
            contentType: 'text',
            content: `## Binary Search Trees (BST)

A Binary Search Tree is a hierarchical structure where for every node:
- All keys in the left subtree are smaller than the node's key.
- All keys in the right subtree are greater than the node's key.

### BST Node:
\`\`\`java
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}
\`\`\`

### Tree Traversals:
1. **In-Order (Left, Node, Right)**: Produces keys in ascending sorted order for a BST.
2. **Pre-Order (Node, Left, Right)**: Useful for serializing or duplicating a tree.
3. **Post-Order (Left, Right, Node)**: Useful for deleting nodes from leaves up.

### Performance:
- Balanced BST (AVL / Red-Black): Search, Insert, Delete operate in $O(\\log n)$.
- Degenerate BST (linked list shape): Degrades to $O(n)$.`
          },
          {
            order: 2,
            title: 'Sorting Algorithms & Divide-and-Conquer',
            contentType: 'text',
            content: `## Merge Sort and Quick Sort

### Merge Sort ($O(n \\log n)$ guaranteed):
Merge sort divides the unsorted list into $n$ sublists of 1 element each, then repeatedly merges sublists to produce new sorted sublists until one remains. It is stable and has $O(n)$ auxiliary space complexity.

\`\`\`java
void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}
\`\`\`

### Quick Sort (In-place, average $O(n \\log n)$):
Selects a pivot element and partitions the array such that elements smaller than the pivot precede it, and larger elements follow it.`
          }
        ]
      }
    ]
  },
  {
    title: 'HTML and CSS Web Development',
    description:
      'Learn modern HTML5 semantics and CSS3 styling techniques. Build clean, accessible, mobile-first responsive web interfaces using CSS Flexbox, CSS Grid, media queries, and accessibility best practices.',
    category: 'Web Development',
    level: 'beginner',
    duration: 14,
    matchingAssessmentTitle: 'HTML and CSS',
    modules: [
      {
        order: 1,
        title: 'Semantic HTML5 & Document Structure',
        description: 'Master document semantics, forms, inputs, accessibility, and ARIA roles.',
        lessons: [
          {
            order: 1,
            title: 'Semantic Markup & Web Accessibility (WCAG)',
            contentType: 'text',
            content: `## Semantic HTML5 Standards

Semantic markup uses tags that communicate meaning to both browsers and assistive screen readers.

### Semantic Elements:
- \`<header>\`: Introductory content and site navigation.
- \`<nav>\`: Set of primary navigational links.
- \`<main>\`: Dominant content unique to the document.
- \`<article>\`: Independent, self-contained syndicatable content.
- \`<section>\`: Thematic grouping of content with a heading.
- \`<aside>\`: Tangentially related supplementary content.
- \`<footer>\`: Author info, copyright, and legal links.

### Accessibility Attributes:
\`\`\`html
<button aria-label="Close dialog" aria-expanded="false" class="close-btn">
  <span aria-hidden="true">&times;</span>
</button>
\`\`\`

Always associate form labels with inputs using \`<label for="inputId">\`.`
          },
          {
            order: 2,
            title: 'HTML5 Form Controls and Native Validation',
            contentType: 'text',
            content: `## Robust Forms and Validation

HTML5 provides native client-side validation constraints without requiring external scripts.

\`\`\`html
<form action="/api/submit" method="POST">
  <div class="field">
    <label for="user-email">Email Address *</label>
    <input
      type="email"
      id="user-email"
      name="email"
      required
      placeholder="employee@corp.com"
      autocomplete="email"
    />
  </div>

  <div class="field">
    <label for="user-age">Age (18-65)</label>
    <input type="number" id="user-age" name="age" min="18" max="65" />
  </div>

  <button type="submit">Submit Registration</button>
</form>
\`\`\``
          }
        ]
      },
      {
        order: 2,
        title: 'Modern CSS3, Flexbox & CSS Grid',
        description: 'Responsive design, box model, CSS Flexbox, CSS Grid, and media queries.',
        lessons: [
          {
            order: 1,
            title: 'CSS Box Model and Flexbox Layouts',
            contentType: 'text',
            content: `## The CSS Box Model & Flexbox

Every element is rendered as a box composed of:
\`\`\`
Content -> Padding -> Border -> Margin
\`\`\`
Always configure \`box-sizing: border-box\` so padding and borders are included in the declared width and height.

### One-Dimensional Layouts with Flexbox:
\`\`\`css
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  flex: 0 0 auto;
}
\`\`\`

- \`justify-content\`: Aligns items along the main axis.
- \`align-items\`: Aligns items along the cross axis.`
          },
          {
            order: 2,
            title: 'Two-Dimensional Layouts with CSS Grid & Media Queries',
            contentType: 'text',
            content: `## Responsive Two-Dimensional CSS Grid

CSS Grid provides true row-and-column layout control.

\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    padding: 1rem;
  }
}
\`\`\`

The \`repeat(auto-fit, minmax(280px, 1fr))\` pattern automatically calculates columns based on available container width without requiring breakpoint overrides.`
          }
        ]
      }
    ]
  },
  {
    title: 'JavaScript Fundamentals',
    description:
      'Master modern ECMAScript standards (ES6+). Understand execution contexts, closures, prototypes, asynchronous JavaScript with Promises and Async/Await, the Event Loop, and DOM manipulation.',
    category: 'Web Development',
    level: 'beginner',
    duration: 18,
    matchingAssessmentTitle: 'JavaScript',
    modules: [
      {
        order: 1,
        title: 'JavaScript Execution & Core Language Features',
        description: 'Variables, scoping, hoisting, closures, and the prototype chain.',
        lessons: [
          {
            order: 1,
            title: 'Variable Declarations (var vs let vs const) & Scopes',
            contentType: 'text',
            content: `## Scopes and Variable Declarations

JavaScript features three declaration keywords:
- \`var\`: Function-scoped, hoisted and initialized to \`undefined\`. Allows re-declaration.
- \`let\`: Block-scoped (\`{}\`), hoisted to the Temporal Dead Zone (TDZ). Re-assignment allowed.
- \`const\`: Block-scoped, in TDZ until declared. Re-assignment prohibited (values of mutable objects can still be modified).

\`\`\`javascript
function calculateDiscount(price, isMember) {
  let discount = 0;
  if (isMember) {
    const rate = 0.15;
    discount = price * rate;
  }
  // rate is inaccessible here (block-scoped)
  return price - discount;
}
\`\`\``
          },
          {
            order: 2,
            title: 'Closures and Lexical Scope',
            contentType: 'text',
            content: `## Understanding Closures

A closure is the combination of a function bundled together with references to its surrounding lexical environment. A closure gives an inner function access to an outer function's scope even after the outer function has returned.

\`\`\`javascript
function createCounter(initialValue = 0) {
  let count = initialValue;

  return {
    increment() {
      count += 1;
      return count;
    },
    decrement() {
      count -= 1;
      return count;
    },
    getCount() {
      return count;
    }
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.increment()); // 12
console.log(counter.getCount());  // 12
\`\`\`

### Practical Use Cases:
- Data encapsulation (private variables).
- Currying and functional composition.
- Event listeners and callbacks.`
          }
        ]
      },
      {
        order: 2,
        title: 'Asynchronous JavaScript & Event Loop',
        description: 'The JavaScript runtime model, Call Stack, Event Loop, Promises, and Async/Await.',
        lessons: [
          {
            order: 1,
            title: 'The Event Loop and Microtask Queue',
            contentType: 'text',
            content: `## The JavaScript Concurrency Model

JavaScript is a single-threaded runtime with an event-driven non-blocking I/O model.

### Key Components:
1. **Call Stack**: Executes synchronous frames in LIFO order.
2. **Web APIs / Node APIs**: Handles asynchronous timers, I/O, network requests in background threads.
3. **Microtask Queue**: Promises, \`queueMicrotask\`, \`process.nextTick\`. Processed immediately after the current stack frame empties, before macrotasks.
4. **Macrotask Queue (Task Queue)**: \`setTimeout\`, \`setInterval\`, I/O callbacks.

\`\`\`javascript
console.log('1'); // Synchronous

setTimeout(() => console.log('2'), 0); // Macrotask

Promise.resolve().then(() => console.log('3')); // Microtask

console.log('4'); // Synchronous

// Execution output order: 1 -> 4 -> 3 -> 2
\`\`\``
          },
          {
            order: 2,
            title: 'Promises and Async/Await Error Handling',
            contentType: 'text',
            content: `## Working with Promises & Async/Await

Async/await provides cleaner syntax for handling asynchronous operations without promise chaining.

\`\`\`javascript
async function fetchEmployeeProfile(employeeId) {
  try {
    const response = await fetch(\`/api/employees/\${employeeId}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load profile:', error.message);
    throw error;
  }
}
\`\`\`

Always wrap \`await\` expressions in \`try/catch\` blocks to catch rejected promises.`
          }
        ]
      }
    ]
  },
  {
    title: 'React.js Development',
    description:
      'Build performant, declarative user interfaces with React.js. Learn modern functional components, JSX syntax, state and props management, built-in hooks (useState, useEffect, useMemo, useCallback, useRef), context API, and routing.',
    category: 'Web Development',
    level: 'intermediate',
    duration: 20,
    matchingAssessmentTitle: 'React.js',
    modules: [
      {
        order: 1,
        title: 'Components, JSX & Essential Hooks',
        description: 'Functional component architecture, JSX rules, useState, and useEffect.',
        lessons: [
          {
            order: 1,
            title: 'Functional Components and State Management with useState',
            contentType: 'text',
            content: `## React Functional Components & JSX

JSX is a syntax extension for JavaScript that compiles into \`React.createElement()\` calls.

### Rules of Hooks:
1. Only call hooks at the top level of functional components or custom hooks (never inside loops, conditions, or nested functions).
2. Only call hooks from React function components.

\`\`\`jsx
import React, { useState } from 'react';

export function CourseEnrollButton({ courseId, initialEnrolled }) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await api.post(\`/enrollments\`, { courseId });
      setIsEnrolled(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleEnroll} disabled={loading || isEnrolled}>
      {loading ? 'Processing...' : isEnrolled ? 'Enrolled' : 'Enroll Now'}
    </button>
  );
}
\`\`\``
          },
          {
            order: 2,
            title: 'Lifecycle Synchronization with useEffect',
            contentType: 'text',
            content: `## The useEffect Hook

\`useEffect\` lets you synchronize a component with external systems (network requests, DOM manipulation, timers).

\`\`\`jsx
import React, { useState, useEffect } from 'react';

export function TimerComponent({ durationSeconds, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // Cleanup function: runs on unmount or before effect re-runs
    return () => clearInterval(timerId);
  }, [timeLeft, onExpire]);

  return <div>Time remaining: {timeLeft}s</div>;
}
\`\`\``
          }
        ]
      },
      {
        order: 2,
        title: 'Performance Optimization & Context API',
        description: 'Memoization with useMemo and useCallback, React Context for state, and component patterns.',
        lessons: [
          {
            order: 1,
            title: 'Memoization: useMemo, useCallback & React.memo',
            contentType: 'text',
            content: `## Performance Tuning in React

Avoid premature optimization, but use memoization hooks to prevent expensive recalculations and redundant child re-renders.

### Key Hooks:
- \`useMemo\`: Caches the *result* of a calculation between renders.
- \`useCallback\`: Caches a *function definition* between renders so child components receive a stable reference.
- \`React.memo\`: Higher-order component that skips re-rendering a component if its props haven't changed.

\`\`\`jsx
const filteredCourses = useMemo(() => {
  return courses.filter((c) => c.status === 'published' && c.category === activeCategory);
}, [courses, activeCategory]);

const handleSelect = useCallback((id) => {
  setActiveCourseId(id);
}, []);
\`\`\``
          },
          {
            order: 2,
            title: 'Global State Management with Context API',
            contentType: 'text',
            content: `## React Context API

Context provides a way to share values between components without passing props down through intermediate levels.

\`\`\`jsx
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
\`\`\``
          }
        ]
      }
    ]
  },
  {
    title: 'Node.js and Express.js',
    description:
      'Architect resilient backend services with Node.js and Express.js. Learn non-blocking I/O, middleware pipelines, RESTful routing, authentication with JWT, error handling, rate limiting, and security best practices.',
    category: 'Backend Development',
    level: 'intermediate',
    duration: 20,
    matchingAssessmentTitle: 'Node.js and Express.js',
    modules: [
      {
        order: 1,
        title: 'Node.js Runtime & Asynchronous Fundamentals',
        description: 'Node.js event-driven architecture, CommonJS vs ES Modules, and stream processing.',
        lessons: [
          {
            order: 1,
            title: 'Node.js Architecture and Non-Blocking I/O',
            contentType: 'text',
            content: `## Node.js Architectural Foundations

Node.js is built on the Google Chrome V8 engine and uses the \`libuv\` C library for handling asynchronous, event-driven operating system operations.

### Key Architecture:
- Single thread runs JavaScript code and the event loop.
- A thread pool (managed by \`libuv\`) handles heavy file system I/O, DNS resolution, and crypto calculations without blocking the main event thread.

\`\`\`javascript
const fs = require('fs/promises');

async function readConfigFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('File read error:', error.message);
    throw error;
  }
}
\`\`\``
          },
          {
            order: 2,
            title: 'Buffers, Streams, and EventEmitters',
            contentType: 'text',
            content: `## Streams and Event-Driven Processing

Streams allow processing large quantities of data chunk by chunk without reading the entire dataset into RAM at once.

\`\`\`javascript
const fs = require('fs');

const readStream = fs.createReadStream('large_dataset.csv');
const writeStream = fs.createWriteStream('processed_dataset.csv');

// Pipelining streams with backpressure management:
readStream.pipe(writeStream);
\`\`\`

Four Fundamental Stream Types:
1. **Readable**: Source of data (e.g. \`req\`).
2. **Writable**: Destination for data (e.g. \`res\`).
3. **Duplex**: Both readable and writable (e.g. TCP socket).
4. **Transform**: Modifies or transforms data as it is written and read.`
          }
        ]
      },
      {
        order: 2,
        title: 'Express.js REST APIs & Middleware Pipelines',
        description: 'Routing, middleware chains, central error handling, security headers, and rate limiting.',
        lessons: [
          {
            order: 1,
            title: 'Middleware Architecture & Centralized Error Handling',
            contentType: 'text',
            content: `## Express Middleware Pipelines

Middleware functions in Express have access to \`req\`, \`res\`, and the \`next\` function in the application's request-response cycle.

\`\`\`javascript
const express = require('express');
const app = express();

app.use(express.json());

// Custom Authentication Middleware:
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Central Error Handling Middleware (must declare 4 parameters):
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});
\`\`\``
          },
          {
            order: 2,
            title: 'Security Hardening with Helmet, CORS & Rate Limiting',
            contentType: 'text',
            content: `## Production API Security Best Practices

Securing an Express API requires defensive layers:

1. **Helmet**: Sets critical HTTP response headers (\`X-Content-Type-Options\`, \`Strict-Transport-Security\`, \`X-Frame-Options\`).
2. **CORS (Cross-Origin Resource Sharing)**: Whitelists allowed client domains.
3. **Rate Limiting**: Protects against brute-force and DoS attacks by restricting requests per IP address.

\`\`\`javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);
\`\`\``
          }
        ]
      }
    ]
  },
  {
    title: 'SQL and Database Management',
    description:
      'Design, query, and optimize relational database management systems (RDBMS). Master SQL DDL/DML, primary/foreign key integrity, complex JOIN queries, subqueries, indexing strategies, transactions, and ACID compliance.',
    category: 'Database & Storage',
    level: 'intermediate',
    duration: 16,
    matchingAssessmentTitle: 'SQL and Database Management',
    modules: [
      {
        order: 1,
        title: 'Relational Schema Design & DDL/DML',
        description: 'Entity relationships, schema constraints, normalization, and basic CRUD operations.',
        lessons: [
          {
            order: 1,
            title: 'Database Normalization and Schema Constraints',
            contentType: 'text',
            content: `## Relational Schema Design & Normalization

Normalization organizes database columns and tables to reduce data redundancy and improve data integrity.

### Normal Forms:
1. **1NF (First Normal Form)**: Each table cell contains a single atomic value; each record is unique.
2. **2NF (Second Normal Form)**: In 1NF and all non-key attributes are fully functionally dependent on the entire primary key.
3. **3NF (Third Normal Form)**: In 2NF and no transitive dependencies exist (non-key columns depend ONLY on the primary key).

\`\`\`sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    salary NUMERIC(10, 2) CHECK (salary >= 0)
);
\`\`\``
          },
          {
            order: 2,
            title: 'Data Manipulation Language (DML) Statements',
            contentType: 'text',
            content: `## Essential DML Operations

DML commands allow querying and modifying persisted table rows:

\`\`\`sql
-- INSERT with return values:
INSERT INTO employees (name, email, department_id, salary)
VALUES ('Rithika Karthikeyan', 'employee@skilltrack.demo', 1, 85000.00);

-- UPDATE with WHERE safety clause:
UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 1;

-- Soft Delete vs Hard Delete:
-- Hard Delete:
DELETE FROM employees WHERE id = 42;
-- Soft Delete (Preferred for auditability):
UPDATE employees SET is_active = FALSE WHERE id = 42;
\`\`\`

Always use parameterized queries (\`$1, $2\`) to protect against SQL Injection vulnerabilities.`
          }
        ]
      },
      {
        order: 2,
        title: 'Advanced Queries, Joins, Indexing & ACID',
        description: 'INNER/LEFT/RIGHT JOINs, aggregations, B-Tree indexes, and database transactions.',
        lessons: [
          {
            order: 1,
            title: 'SQL Joins, Aggregation, and Grouping',
            contentType: 'text',
            content: `## Multi-Table Queries with Joins

Joins combine rows from two or more tables based on a related common column.

\`\`\`sql
SELECT 
    d.name AS department_name,
    COUNT(e.id) AS total_employees,
    ROUND(AVG(e.salary), 2) AS average_salary
FROM departments d
INNER JOIN employees e ON d.id = e.department_id
WHERE e.is_active = TRUE
GROUP BY d.name
HAVING COUNT(e.id) >= 5
ORDER BY average_salary DESC;
\`\`\`

- **INNER JOIN**: Returns records that have matching values in both tables.
- **LEFT JOIN**: Returns all records from the left table, and matched records from the right table.`
          },
          {
            order: 2,
            title: 'Indexes, Query Plans & ACID Transactions',
            contentType: 'text',
            content: `## ACID Properties & Database Transactions

Transactions guarantee that multiple operations either succeed together or fail together without leaving data in an inconsistent state.

### ACID Principles:
- **Atomicity**: All changes execute as a single unit or all rollback.
- **Consistency**: State changes conform strictly to schema constraints.
- **Isolation**: Concurrent transactions do not interfere with each other.
- **Durability**: Committed data survives system crashes and power failures.

\`\`\`sql
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 500 WHERE id = 101;
UPDATE accounts SET balance = balance + 500 WHERE id = 202;
COMMIT;
\`\`\``
          }
        ]
      }
    ]
  },
  {
    title: 'MongoDB and MERN Stack',
    description:
      'Build end-to-end modern web applications using MongoDB, Express.js, React.js, and Node.js (MERN). Master document modeling with Mongoose, schemas, embedded vs referenced relations, indexing, and full-stack integration.',
    category: 'Full Stack Development',
    level: 'intermediate',
    duration: 22,
    matchingAssessmentTitle: 'MongoDB and MERN Stack',
    modules: [
      {
        order: 1,
        title: 'MongoDB Schema Design & Mongoose ODM',
        description: 'BSON document structure, collections, Mongoose schemas, validation, and indexes.',
        lessons: [
          {
            order: 1,
            title: 'NoSQL Document Model vs Relational Data',
            contentType: 'text',
            content: `## Document-Oriented Data Modeling

MongoDB stores data in flexible BSON (Binary JSON) documents organized within collections.

### Embedding vs Referencing:
- **Embedding (Denormalization)**:
  - Best for 1-to-Few relationships where child data is always read together with parent data (e.g., question options inside a question).
  - High read performance; single document write atomicity.
- **Referencing (Normalization)**:
  - Best for 1-to-Many or Many-to-Many relationships where child documents grow unboundedly or need independent lifecycle tracking (e.g., \`enrollment\` referencing \`course\` and \`employee\`).

\`\`\`javascript
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedAnswers: [String]
}, { _id: false });
\`\`\``
          },
          {
            order: 2,
            title: 'Mongoose Middleware, Virtuals, and Indexing',
            contentType: 'text',
            content: `## Advanced Mongoose Patterns

### Compound Unique Indexes:
Indexes prevent duplicate entries and accelerate query performance.

\`\`\`javascript
const enrollmentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progressPercentage: { type: Number, default: 0 }
});

// Enforce single enrollment per employee/course:
enrollmentSchema.index({ employee: 1, course: 1 }, { unique: true });
\`\`\`

### Pre-Save Hooks:
Use \`pre('save')\` for password hashing or automated timestamps before persisting documents.`
          }
        ]
      },
      {
        order: 2,
        title: 'MERN Integration & Full-Stack Architecture',
        description: 'Connecting React client, Express REST APIs, JWT authentication, and MongoDB.',
        lessons: [
          {
            order: 1,
            title: 'JWT Authentication Flow Across MERN Stack',
            contentType: 'text',
            content: `## The MERN Authentication Pipeline

1. **Client (React)**: User enters credentials into login form; client sends \`POST /api/auth/login\`.
2. **Server (Express + Mongoose)**:
   - Validates email and verifies hashed password via \`bcryptjs.compare()\`.
   - Generates signed JSON Web Token (JWT) containing payload (\`userId\`, \`role\`).
   - Returns JWT in JSON response.
3. **Storage & Headers**: Client stores token in memory/localStorage and attaches \`Authorization: Bearer <token>\` to subsequent Axios requests.
4. **Protected Routing**: Express auth middleware verifies token signature before executing route handlers.`
          },
          {
            order: 2,
            title: 'Aggregation Pipelines & Performance Optimization',
            contentType: 'text',
            content: `## MongoDB Aggregation Framework

The aggregation pipeline processes documents through stages:

\`\`\`javascript
const stats = await AssessmentAttempt.aggregate([
  { $match: { assessment: assessmentId, status: 'submitted' } },
  {
    $group: {
      _id: '$result',
      count: { $sum: 1 },
      avgScore: { $avg: '$percentage' }
    }
  }
]);
\`\`\`

Common stages include \`$match\`, \`$project\`, \`$group\`, \`$sort\`, \`$lookup\`, and \`$unwind\`.`
          }
        ]
      }
    ]
  },
  {
    title: 'Software Engineering and Computer Networks',
    description:
      'Understand core software engineering methodologies and computer networking fundamentals. Learn the SDLC, Agile/Scrum, Git collaboration, CI/CD, OSI and TCP/IP models, HTTP/HTTPS, DNS, and network security.',
    category: 'Computer Science',
    level: 'intermediate',
    duration: 20,
    matchingAssessmentTitle: 'Software Engineering and Computer Networks',
    modules: [
      {
        order: 1,
        title: 'Software Development Lifecycle & Design Principles',
        description: 'SDLC stages, Agile Scrum methodologies, Clean Architecture, and SOLID principles.',
        lessons: [
          {
            order: 1,
            title: 'The SDLC and Agile Methodologies',
            contentType: 'text',
            content: `## Software Development Life Cycle (SDLC)

The SDLC provides a structured framework for delivering high-quality software:

### Core Phases:
1. **Requirements Gathering & Analysis**: Defining stakeholder needs and technical constraints.
2. **System Design & Architecture**: Creating ER diagrams, API contracts, and technology selection.
3. **Implementation (Coding)**: Writing modular, tested codebase adhering to team style guides.
4. **Testing & QA**: Automated unit, integration, end-to-end, and performance testing.
5. **Deployment & CI/CD**: Automated build, containerization, and release management.
6. **Maintenance & Monitoring**: Error logging, performance metrics, and security patching.

### Agile & Scrum:
Agile emphasizes iterative delivery, short sprints (1-3 weeks), daily standups, and rapid response to shifting requirements.`
          },
          {
            order: 2,
            title: 'SOLID Principles of Object-Oriented Design',
            contentType: 'text',
            content: `## The SOLID Principles

1. **S - Single Responsibility Principle**: A class should have one, and only one, reason to change.
2. **O - Open/Closed Principle**: Software entities should be open for extension, but closed for modification.
3. **L - Liskov Substitution Principle**: Subtypes must be substitutable for their base types without altering program correctness.
4. **I - Interface Segregation Principle**: Clients should not be forced to depend on methods they do not use.
5. **D - Dependency Inversion Principle**: Depend upon abstractions, not concrete implementations.`
          }
        ]
      },
      {
        order: 2,
        title: 'Computer Networking, OSI Model & HTTP Protocols',
        description: 'OSI 7-layer model, TCP vs UDP, IP addressing, DNS, and HTTP/HTTPS request-response cycles.',
        lessons: [
          {
            order: 1,
            title: 'OSI 7-Layer Model and TCP/IP Protocol Stack',
            contentType: 'text',
            content: `## Computer Network Layers

The Open Systems Interconnection (OSI) model conceptualizes how data travels across a network:

| Layer # | Name | Primary Protocol / Function |
| :--- | :--- | :--- |
| **7** | Application | HTTP, HTTPS, DNS, SMTP, FTP |
| **6** | Presentation | Encryption (TLS/SSL), Serialization |
| **5** | Session | Authentication, Session Management |
| **4** | Transport | TCP (Reliable, Connection-oriented), UDP (Connectionless) |
| **3** | Network | IP, Routing, Logical Addressing |
| **2** | Data Link | Ethernet, MAC Addressing, Frame delivery |
| **1** | Physical | Electrical signals, optical pulses, cables |

### TCP vs UDP:
- **TCP**: Guarantees ordered, loss-free transmission via 3-Way Handshake (\`SYN\`, \`SYN-ACK\`, \`ACK\`).
- **UDP**: Lightweight and fast, without delivery confirmations (ideal for video streaming and VoIP).`
          },
          {
            order: 2,
            title: 'HTTP, HTTPS, TLS Handshake & DNS Resolution',
            contentType: 'text',
            content: `## How Web Requests Work

### DNS Lookup Flow:
1. Browser checks cache $\\rightarrow$ OS cache $\\rightarrow$ Recursive Resolver.
2. Resolver queries Root DNS $\\rightarrow$ TLD (.com) $\\rightarrow$ Authoritative Nameserver.
3. IP address returned to client.

### HTTPS & TLS Handshake:
HTTPS wraps HTTP inside a TLS (Transport Layer Security) encrypted tunnel.
- Uses Asymmetric cryptography for the initial handshake and key exchange.
- Uses Symmetric encryption (AES) for high-performance session data transfer.`
          }
        ]
      }
    ]
  }
];

module.exports = courseData;
