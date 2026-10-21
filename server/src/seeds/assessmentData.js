/**
 * 10 Mandated Assessments with Exactly 10 Single-Choice MCQs Each (100 MCQs total).
 * 4 options per question (A, B, C, D), 1 correct answer, 2 marks per question, 30 min duration, 70% passing threshold.
 */

const assessmentData = [
  {
    title: 'Java Fundamentals',
    courseTitle: 'Java Programming Fundamentals',
    description: 'Comprehensive assessment evaluating core Java syntax, data types, JVM architecture, control flow, and methods.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What is the primary role of the Java Virtual Machine (JVM)?',
        options: [
          { key: 'A', text: 'To compile Java source code (.java) into bytecode (.class)' },
          { key: 'B', text: 'To execute compiled bytecode on any underlying operating system' },
          { key: 'C', text: 'To act as an IDE for writing Java applications' },
          { key: 'D', text: 'To package Java code into executable JAR files' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'Which of the following is NOT a primitive data type in Java?',
        options: [
          { key: 'A', text: 'boolean' },
          { key: 'B', text: 'int' },
          { key: 'C', text: 'String' },
          { key: 'D', text: 'double' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What will be the output of `System.out.println(10 / 4);` in Java?',
        options: [
          { key: 'A', text: '2.5' },
          { key: 'B', text: '2' },
          { key: 'C', text: '2.0' },
          { key: 'D', text: 'Compilation error' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'Which keyword is used in Java to prevent a method from being overridden or a class from being subclassed?',
        options: [
          { key: 'A', text: 'static' },
          { key: 'B', text: 'abstract' },
          { key: 'C', text: 'final' },
          { key: 'D', text: 'constant' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'How is parameter passing handled in Java?',
        options: [
          { key: 'A', text: 'Strictly Pass-by-Value for both primitives and object references' },
          { key: 'B', text: 'Pass-by-Value for primitives and Pass-by-Reference for objects' },
          { key: 'C', text: 'Strictly Pass-by-Reference for all variables' },
          { key: 'D', text: 'Depends on whether the method is declared static' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What is the default initial value of a boolean instance variable in a Java class?',
        options: [
          { key: 'A', text: 'true' },
          { key: 'B', text: 'false' },
          { key: 'C', text: 'null' },
          { key: 'D', text: '0' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What occurs when you attempt to access `arr[arr.length]` on an array `int[] arr = new int[5];`?',
        options: [
          { key: 'A', text: 'Returns 0' },
          { key: 'B', text: 'Returns null' },
          { key: 'C', text: 'Throws ArrayIndexOutOfBoundsException at runtime' },
          { key: 'D', text: 'Causes a compilation error' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which loop is guaranteed to execute its code block at least once regardless of condition?',
        options: [
          { key: 'A', text: 'for loop' },
          { key: 'B', text: 'while loop' },
          { key: 'C', text: 'do-while loop' },
          { key: 'D', text: 'enhanced for-each loop' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'Which statement correctly characterizes method overloading in Java?',
        options: [
          { key: 'A', text: 'Methods must have the same name and identical parameter lists but different return types' },
          { key: 'B', text: 'Methods share the same name with different parameter types, numbers, or order' },
          { key: 'C', text: 'Methods can only be overloaded across parent and child classes' },
          { key: 'D', text: 'Overloaded methods must be marked with the @Override annotation' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'Which tool in the JDK is responsible for compiling .java files into .class bytecode files?',
        options: [
          { key: 'A', text: 'java' },
          { key: 'B', text: 'javadoc' },
          { key: 'C', text: 'javac' },
          { key: 'D', text: 'jar' }
        ],
        correctAnswers: ['C'],
        marks: 2
      }
    ]
  },
  {
    title: 'Object-Oriented Programming',
    courseTitle: 'Object-Oriented Programming',
    description: 'Assessment covering encapsulation, inheritance, polymorphism, abstraction, interface design, and clean architecture.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'Which OOP pillar is demonstrated by making fields private and providing getters and setters?',
        options: [
          { key: 'A', text: 'Inheritance' },
          { key: 'B', text: 'Encapsulation' },
          { key: 'C', text: 'Polymorphism' },
          { key: 'D', text: 'Abstraction' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'Which access modifier allows access within the same class and its subclasses, even in different packages?',
        options: [
          { key: 'A', text: 'private' },
          { key: 'B', text: 'default (package-private)' },
          { key: 'C', text: 'protected' },
          { key: 'D', text: 'public' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What is dynamic method dispatch (runtime polymorphism)?',
        options: [
          { key: 'A', text: 'Resolving method calls at compile time based on reference type' },
          { key: 'B', text: 'Resolving overridden method calls at runtime based on the actual object type' },
          { key: 'C', text: 'Overloading methods with different parameter counts' },
          { key: 'D', text: 'Executing multiple methods concurrently using multi-threading' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'Can an abstract class be directly instantiated with the `new` operator?',
        options: [
          { key: 'A', text: 'Yes, if all its methods are implemented' },
          { key: 'B', text: 'No, abstract classes cannot be directly instantiated' },
          { key: 'C', text: 'Yes, by providing an empty constructor' },
          { key: 'D', text: 'Only if declared inside the main method' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'Which keyword allows a child class constructor to invoke its parent class constructor?',
        options: [
          { key: 'A', text: 'this' },
          { key: 'B', text: 'parent' },
          { key: 'C', text: 'super' },
          { key: 'D', text: 'base' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What is the primary architectural advantage of favoring composition over inheritance?',
        options: [
          { key: 'A', text: 'Composition allows deeper inheritance trees' },
          { key: 'B', text: 'Composition produces looser coupling and greater runtime flexibility' },
          { key: 'C', text: 'Composition runs faster than inheritance in all compilers' },
          { key: 'D', text: 'Composition eliminates the need for constructors' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'Which of the following is true regarding interfaces in Java?',
        options: [
          { key: 'A', text: 'A class can implement only one interface' },
          { key: 'B', text: 'A class can implement multiple interfaces' },
          { key: 'C', text: 'Interface methods are private by default' },
          { key: 'D', text: 'Interfaces cannot contain constant variables' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which concept states that subtypes must be substitutable for their base types without altering program correctness?',
        options: [
          { key: 'A', text: 'Single Responsibility Principle' },
          { key: 'B', text: 'Open/Closed Principle' },
          { key: 'C', text: 'Liskov Substitution Principle' },
          { key: 'D', text: 'Interface Segregation Principle' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What makes an object immutable?',
        options: [
          { key: 'A', text: 'Its state cannot be modified after it is constructed' },
          { key: 'B', text: 'It can only be garbage collected once' },
          { key: 'C', text: 'It has only public fields' },
          { key: 'D', text: 'It implements the Serializable interface' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What happens if a child class defines a method with the exact same signature as a parent class method?',
        options: [
          { key: 'A', text: 'The parent method overrides the child method' },
          { key: 'B', text: 'The child method overrides the parent method' },
          { key: 'C', text: 'A compile-time collision error is always thrown' },
          { key: 'D', text: 'Both methods are executed in parallel' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'Data Structures and Algorithms',
    courseTitle: 'Data Structures and Algorithms',
    description: 'Test your understanding of Big-O complexity, linked lists, binary trees, sorting algorithms, and stacks/queues.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        options: [
          { key: 'A', text: 'O(1)' },
          { key: 'B', text: 'O(log n)' },
          { key: 'C', text: 'O(n)' },
          { key: 'D', text: 'O(n log n)' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'Which data structure follows the Last-In, First-Out (LIFO) principle?',
        options: [
          { key: 'A', text: 'Queue' },
          { key: 'B', text: 'Stack' },
          { key: 'C', text: 'Binary Tree' },
          { key: 'D', text: 'Hash Table' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What is the worst-case time complexity of Merge Sort?',
        options: [
          { key: 'A', text: 'O(n)' },
          { key: 'B', text: 'O(n log n)' },
          { key: 'C', text: 'O(n^2)' },
          { key: 'D', text: 'O(2^n)' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'What is the time complexity of prepending (inserting at the head) in a Singly Linked List?',
        options: [
          { key: 'A', text: 'O(1)' },
          { key: 'B', text: 'O(n)' },
          { key: 'C', text: 'O(log n)' },
          { key: 'D', text: 'O(n^2)' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'Which tree traversal produces the keys of a Binary Search Tree in sorted ascending order?',
        options: [
          { key: 'A', text: 'Pre-order traversal' },
          { key: 'B', text: 'In-order traversal' },
          { key: 'C', text: 'Post-order traversal' },
          { key: 'D', text: 'Level-order traversal' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What is the primary difference between a Singly Linked List and a Doubly Linked List?',
        options: [
          { key: 'A', text: 'Doubly linked lists cannot store primitive values' },
          { key: 'B', text: 'Doubly linked list nodes maintain pointers to both next and previous nodes' },
          { key: 'C', text: 'Singly linked lists require O(1) random access' },
          { key: 'D', text: 'Doubly linked lists have lower memory consumption' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'Which algorithm is based on the Divide-and-Conquer paradigm?',
        options: [
          { key: 'A', text: 'Bubble Sort' },
          { key: 'B', text: 'Linear Search' },
          { key: 'C', text: 'Merge Sort' },
          { key: 'D', text: 'Insertion Sort' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'What is the worst-case time complexity of Quick Sort (e.g. when the chosen pivot is always the maximum or minimum)?',
        options: [
          { key: 'A', text: 'O(log n)' },
          { key: 'B', text: 'O(n)' },
          { key: 'C', text: 'O(n log n)' },
          { key: 'D', text: 'O(n^2)' }
        ],
        correctAnswers: ['D'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What is the time complexity to retrieve an element by its index in an Array of size n?',
        options: [
          { key: 'A', text: 'O(1)' },
          { key: 'B', text: 'O(log n)' },
          { key: 'C', text: 'O(n)' },
          { key: 'D', text: 'O(n^2)' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'Which data structure is most appropriate for implementing Breadth-First Search (BFS) in a graph?',
        options: [
          { key: 'A', text: 'Stack' },
          { key: 'B', text: 'Queue' },
          { key: 'C', text: 'Priority Heap' },
          { key: 'D', text: 'Binary Tree' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'HTML and CSS',
    courseTitle: 'HTML and CSS Web Development',
    description: 'Assessment evaluating HTML5 semantics, accessibility standards (WCAG), CSS box model, Flexbox, and CSS Grid.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'Which HTML5 element is most semantically appropriate for enclosing main navigational links?',
        options: [
          { key: 'A', text: '<menu>' },
          { key: 'B', text: '<nav>' },
          { key: 'C', text: '<aside>' },
          { key: 'D', text: '<section>' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'When `box-sizing: border-box` is applied, how is an element\'s total width calculated?',
        options: [
          { key: 'A', text: 'Declared width + padding + border + margin' },
          { key: 'B', text: 'Declared width includes content, padding, and border' },
          { key: 'C', text: 'Declared width applies only to the inner text content' },
          { key: 'D', text: 'Padding and borders are automatically removed' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'Which CSS Flexbox property controls alignment of flex items along the cross axis?',
        options: [
          { key: 'A', text: 'justify-content' },
          { key: 'B', text: 'align-items' },
          { key: 'C', text: 'flex-direction' },
          { key: 'D', text: 'flex-wrap' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'What is the purpose of the `aria-label` attribute in HTML?',
        options: [
          { key: 'A', text: 'It defines a tooltip that displays on hover' },
          { key: 'B', text: 'It provides an accessible text label for assistive technologies like screen readers' },
          { key: 'C', text: 'It overrides the element\'s font family in CSS' },
          { key: 'D', text: 'It specifies the form submission target URL' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'Which CSS Grid declaration creates responsive columns that wrap automatically without media queries?',
        options: [
          { key: 'A', text: 'grid-template-columns: 1fr 1fr 1fr;' },
          { key: 'B', text: 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));' },
          { key: 'C', text: 'grid-template-rows: repeat(12, 1fr);' },
          { key: 'D', text: 'grid-auto-flow: dense;' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'Which HTML attribute associates a `<label>` with its corresponding `<input>` field?',
        options: [
          { key: 'A', text: 'name' },
          { key: 'B', text: 'for' },
          { key: 'C', text: 'target' },
          { key: 'D', text: 'type' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What does the CSS property `flex-grow: 1` indicate for a flex child item?',
        options: [
          { key: 'A', text: 'The item will shrink to zero width' },
          { key: 'B', text: 'The item can grow to absorb available positive free space along the main axis' },
          { key: 'C', text: 'The item will occupy a fixed 100px width' },
          { key: 'D', text: 'The item is pushed to a new row' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which HTML5 element represents independent, self-contained syndicatable content (e.g. blog post, news story)?',
        options: [
          { key: 'A', text: '<article>' },
          { key: 'B', text: '<aside>' },
          { key: 'C', text: '<div>' },
          { key: 'D', text: '<main>' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'How is a CSS Media Query written to apply styles for viewport widths of 768px or smaller?',
        options: [
          { key: 'A', text: '@media (min-width: 768px)' },
          { key: 'B', text: '@media (max-width: 768px)' },
          { key: 'C', text: '@screen and (device-width: 768px)' },
          { key: 'D', text: '@query (width <= 768px)' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What is the effect of applying `position: sticky; top: 0;` to an element?',
        options: [
          { key: 'A', text: 'The element is fixed relative to the viewport at all times' },
          { key: 'B', text: 'The element toggles between relative and fixed positioning based on scroll position within its parent container' },
          { key: 'C', text: 'The element is hidden until scrolled into view' },
          { key: 'D', text: 'The element becomes static and cannot be positioned' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'JavaScript',
    courseTitle: 'JavaScript Fundamentals',
    description: 'Assessment evaluating closures, scopes, ES6 features, Promises, Event Loop, and asynchronous patterns.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What is a closure in JavaScript?',
        options: [
          { key: 'A', text: 'A syntax construct used to terminate a loop' },
          { key: 'B', text: 'A function bundled together with references to its surrounding lexical environment' },
          { key: 'C', text: 'A method that closes active WebSocket connections' },
          { key: 'D', text: 'A private class field in ES2022' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'How does `let` differ from `var` in JavaScript?',
        options: [
          { key: 'A', text: '`let` is function-scoped while `var` is block-scoped' },
          { key: 'B', text: '`let` is block-scoped and cannot be accessed before declaration (Temporal Dead Zone)' },
          { key: 'C', text: '`var` cannot be reassigned while `let` can' },
          { key: 'D', text: 'There is no difference in modern browsers' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'In what order will the following execute: synchronous code, Promise microtasks, and setTimeout macrotasks?',
        options: [
          { key: 'A', text: 'setTimeout -> Promise -> Synchronous' },
          { key: 'B', text: 'Synchronous -> Promise Microtask -> setTimeout Macrotask' },
          { key: 'C', text: 'Promise Microtask -> Synchronous -> setTimeout Macrotask' },
          { key: 'D', text: 'Synchronous -> setTimeout Macrotask -> Promise Microtask' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'What is the output of `typeof null` in JavaScript?',
        options: [
          { key: 'A', text: '"null"' },
          { key: 'B', text: '"undefined"' },
          { key: 'C', text: '"object"' },
          { key: 'D', text: '"boolean"' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'What does `Promise.all([p1, p2, p3])` do when one of the promises rejects?',
        options: [
          { key: 'A', text: 'It ignores the error and waits for the remaining promises' },
          { key: 'B', text: 'It immediately rejects with the reason of the first rejected promise' },
          { key: 'C', text: 'It retries the failed promise three times' },
          { key: 'D', text: 'It returns an array containing null for the failed promise' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What will `[1, 2, 3].map(x => x * 2)` return?',
        options: [
          { key: 'A', text: '[1, 2, 3]' },
          { key: 'B', text: '[2, 4, 6]' },
          { key: 'C', text: '6' },
          { key: 'D', text: 'undefined' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What does the strict equality operator `===` check?',
        options: [
          { key: 'A', text: 'Checks value equality after performing implicit type coercion' },
          { key: 'B', text: 'Checks both value and data type equality without type coercion' },
          { key: 'C', text: 'Checks only variable memory addresses' },
          { key: 'D', text: 'Checks whether two objects share the same prototype' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which array method tests whether all elements in the array pass the test implemented by the provided function?',
        options: [
          { key: 'A', text: 'some()' },
          { key: 'B', text: 'filter()' },
          { key: 'C', text: 'every()' },
          { key: 'D', text: 'find()' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What happens when an unhandled exception occurs inside an `async` function?',
        options: [
          { key: 'A', text: 'The browser completely halts JavaScript execution' },
          { key: 'B', text: 'The async function returns a rejected Promise' },
          { key: 'C', text: 'The exception is converted into a string value' },
          { key: 'D', text: 'The function automatically restarts' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What is the purpose of the Spread operator (`...`) when copying an object `const copy = { ...original };`?',
        options: [
          { key: 'A', text: 'Performs a deep recursive clone of all nested objects' },
          { key: 'B', text: 'Creates a shallow copy of enumerable own properties' },
          { key: 'C', text: 'Freezes the object preventing any property modifications' },
          { key: 'D', text: 'Converts object properties into an array' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'React.js',
    courseTitle: 'React.js Development',
    description: 'Assessment evaluating functional components, JSX, built-in hooks (useState, useEffect, useMemo), Context API, and state flows.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What are the two primary Rules of Hooks in React?',
        options: [
          { key: 'A', text: 'Hooks must start with "get" and only be called inside class components' },
          { key: 'B', text: 'Only call hooks at the top level and only call hooks from React function components' },
          { key: 'C', text: 'Hooks can only be called inside render loops and conditionals' },
          { key: 'D', text: 'Hooks must always be declared as async functions' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'What happens when you pass an empty dependency array `[]` to `useEffect`?',
        options: [
          { key: 'A', text: 'The effect runs on every single render cycle' },
          { key: 'B', text: 'The effect runs only once after the initial component mount' },
          { key: 'C', text: 'The effect never executes' },
          { key: 'D', text: 'It causes an infinite re-render loop' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What is the primary difference between `useMemo` and `useCallback`?',
        options: [
          { key: 'A', text: '`useMemo` caches a calculation result; `useCallback` caches a function definition' },
          { key: 'B', text: '`useCallback` caches a value; `useMemo` handles side effects' },
          { key: 'C', text: '`useMemo` works only in class components' },
          { key: 'D', text: 'They are identical and interchangeable' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'Why should you never mutate React state directly (e.g. `state.count = 5`)?',
        options: [
          { key: 'A', text: 'Direct mutation throws a browser syntax error' },
          { key: 'B', text: 'React relies on reference equality to detect state changes and schedule re-renders' },
          { key: 'C', text: 'Direct mutation converts numbers into strings' },
          { key: 'D', text: 'React automatically deletes mutated properties' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'How is cleanup logic defined inside a `useEffect` hook?',
        options: [
          { key: 'A', text: 'By passing a second callback function to useEffect' },
          { key: 'B', text: 'By returning a cleanup function from the effect callback' },
          { key: 'C', text: 'By calling `useEffect.cleanup()`' },
          { key: 'D', text: 'By using the componentDestroyed hook' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What is the purpose of the `key` prop when rendering a dynamic list in React?',
        options: [
          { key: 'A', text: 'It sets the CSS class name for the list item' },
          { key: 'B', text: 'It helps React identify which items have changed, been added, or been removed during reconciliation' },
          { key: 'C', text: 'It encrypts component data in memory' },
          { key: 'D', text: 'It determines the tab navigation order' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What hook should be used to persist a mutable value that does NOT trigger a re-render when changed?',
        options: [
          { key: 'A', text: 'useState' },
          { key: 'B', text: 'useRef' },
          { key: 'C', text: 'useMemo' },
          { key: 'D', text: 'useEffect' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which React tool solves prop-drilling by providing data to deeply nested components without passing props?',
        options: [
          { key: 'A', text: 'React.Fragment' },
          { key: 'B', text: 'Context API' },
          { key: 'C', text: 'Virtual DOM' },
          { key: 'D', text: 'Error Boundaries' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What does `React.memo()` do for a functional component?',
        options: [
          { key: 'A', text: 'Prevents the component from rendering on mount' },
          { key: 'B', text: 'Skips re-rendering if its props have not changed (shallow equality comparison)' },
          { key: 'C', text: 'Stores component state in browser localStorage' },
          { key: 'D', text: 'Automatically optimizes all nested network requests' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'When calling a state setter based on previous state, which pattern is recommended?',
        options: [
          { key: 'A', text: '`setCount(count + 1)`' },
          { key: 'B', text: '`setCount(prev => prev + 1)` (functional updater)' },
          { key: 'C', text: '`count++`' },
          { key: 'D', text: '`setCount(this.state.count + 1)`' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'Node.js and Express.js',
    courseTitle: 'Node.js and Express.js',
    description: 'Assessment evaluating Node runtime architecture, non-blocking I/O, Express routing, middleware pipelines, and API security.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What library provides the event loop and asynchronous I/O thread pool in Node.js?',
        options: [
          { key: 'A', text: 'V8' },
          { key: 'B', text: 'libuv' },
          { key: 'C', text: 'Blink' },
          { key: 'D', text: 'Webpack' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'In an Express.js middleware function, what must be called to pass control to the next handler?',
        options: [
          { key: 'A', text: '`res.send()`' },
          { key: 'B', text: '`next()`' },
          { key: 'C', text: '`req.continue()`' },
          { key: 'D', text: '`return true`' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'How does an Express centralized error-handling middleware distinguish itself from standard middleware?',
        options: [
          { key: 'A', text: 'It must be declared with four arguments: `(err, req, res, next)`' },
          { key: 'B', text: 'It must be placed at the very top of `app.js`' },
          { key: 'C', text: 'It must use `app.error()` instead of `app.use()`' },
          { key: 'D', text: 'It must return a Promise' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'Which security header package is standard in production Express applications to set defensive HTTP headers?',
        options: [
          { key: 'A', text: 'cors' },
          { key: 'B', text: 'morgan' },
          { key: 'C', text: 'helmet' },
          { key: 'D', text: 'dotenv' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'What is the primary benefit of using Node.js Streams rather than `fs.readFile()`?',
        options: [
          { key: 'A', text: 'Streams automatically parse JSON objects' },
          { key: 'B', text: 'Streams process large files in small chunks without loading the whole file into RAM' },
          { key: 'C', text: 'Streams run synchronously on the main thread' },
          { key: 'D', text: 'Streams prevent file system permissions errors' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What HTTP status code should be returned when an authentication token is missing or invalid?',
        options: [
          { key: 'A', text: '200 OK' },
          { key: 'B', text: '400 Bad Request' },
          { key: 'C', text: '401 Unauthorized' },
          { key: 'D', text: '404 Not Found' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What does the standard `express.json()` middleware do?',
        options: [
          { key: 'A', text: 'Converts database collections into JSON strings' },
          { key: 'B', text: 'Parses incoming requests with JSON payloads and populates `req.body`' },
          { key: 'C', text: 'Validates URL query parameters' },
          { key: 'D', text: 'Encrypts outgoing HTTP responses' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which HTTP header is examined by Express to parse JWT tokens in standard Bearer authentication?',
        options: [
          { key: 'A', text: 'Accept-Encoding' },
          { key: 'B', text: 'Authorization' },
          { key: 'C', text: 'Content-Type' },
          { key: 'D', text: 'X-Forwarded-For' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What is the purpose of rate limiting middleware in an Express REST API?',
        options: [
          { key: 'A', text: 'To compress response body payloads' },
          { key: 'B', text: 'To mitigate brute-force and Denial-of-Service (DoS) attacks by limiting request frequencies' },
          { key: 'C', text: 'To balance load across multiple CPU cores' },
          { key: 'D', text: 'To cache static assets in browser storage' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What built-in Node.js module provides cryptographically secure pseudo-random bytes and hashing?',
        options: [
          { key: 'A', text: 'path' },
          { key: 'B', text: 'http' },
          { key: 'C', text: 'crypto' },
          { key: 'D', text: 'events' }
        ],
        correctAnswers: ['C'],
        marks: 2
      }
    ]
  },
  {
    title: 'SQL and Database Management',
    courseTitle: 'SQL and Database Management',
    description: 'Assessment covering relational schema design, normalization, joins, indexes, ACID properties, and transactions.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What database design rule is satisfied when a table has atomic values and no repeating groups?',
        options: [
          { key: 'A', text: 'First Normal Form (1NF)' },
          { key: 'B', text: 'Second Normal Form (2NF)' },
          { key: 'C', text: 'Third Normal Form (3NF)' },
          { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'Which SQL JOIN returns all rows from the left table and matched rows from the right table?',
        options: [
          { key: 'A', text: 'INNER JOIN' },
          { key: 'B', text: 'LEFT JOIN (LEFT OUTER JOIN)' },
          { key: 'C', text: 'RIGHT JOIN' },
          { key: 'D', text: 'CROSS JOIN' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What does the "A" in ACID database transactions represent?',
        options: [
          { key: 'A', text: 'Asynchronous' },
          { key: 'B', text: 'Atomicity (all operations succeed or all roll back)' },
          { key: 'C', text: 'Authentication' },
          { key: 'D', text: 'Auditability' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'Which clause is used to filter aggregated groups created by a `GROUP BY` clause?',
        options: [
          { key: 'A', text: 'WHERE' },
          { key: 'B', text: 'HAVING' },
          { key: 'C', text: 'FILTER' },
          { key: 'D', text: 'LIMIT' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'What is the primary function of a database Index (e.g. B-Tree)?',
        options: [
          { key: 'A', text: 'To encrypt sensitive column values on disk' },
          { key: 'B', text: 'To dramatically speed up data retrieval queries at the cost of slight write overhead' },
          { key: 'C', text: 'To automatically backup database tables' },
          { key: 'D', text: 'To enforce foreign key relationships' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'Which SQL command permanently applies all changes made during the current transaction?',
        options: [
          { key: 'A', text: 'SAVE' },
          { key: 'B', text: 'ROLLBACK' },
          { key: 'C', text: 'COMMIT' },
          { key: 'D', text: 'PERSIST' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'What is a Foreign Key constraint?',
        options: [
          { key: 'A', text: 'A key that must contain unique values within its own table' },
          { key: 'B', text: 'A column that establishes a link and enforces referential integrity to another table\'s Primary Key' },
          { key: 'C', text: 'A key used strictly for encryption' },
          { key: 'D', text: 'A temporary index created during query execution' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which SQL query retrieves the total count of distinct departments from an employees table?',
        options: [
          { key: 'A', text: 'SELECT COUNT(department_id) FROM employees;' },
          { key: 'B', text: 'SELECT COUNT(DISTINCT department_id) FROM employees;' },
          { key: 'C', text: 'SELECT DISTINCT(COUNT department_id) FROM employees;' },
          { key: 'D', text: 'SELECT UNIQUE COUNT(department_id) FROM employees;' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What is the risk of constructing SQL queries using direct string concatenation with user inputs?',
        options: [
          { key: 'A', text: 'Cross-Site Scripting (XSS)' },
          { key: 'B', text: 'SQL Injection (SQLi)' },
          { key: 'C', text: 'Buffer Overflow' },
          { key: 'D', text: 'Race Condition' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'In Third Normal Form (3NF), what type of dependency must be eliminated?',
        options: [
          { key: 'A', text: 'Partial functional dependencies' },
          { key: 'B', text: 'Transitive functional dependencies' },
          { key: 'C', text: 'Multi-valued dependencies' },
          { key: 'D', text: 'Circular dependencies' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'MongoDB and MERN Stack',
    courseTitle: 'MongoDB and MERN Stack',
    description: 'Assessment evaluating document modeling, Mongoose schemas, compound indexes, aggregation pipelines, and MERN integration.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'What data format is natively used by MongoDB to store documents on disk and over the wire?',
        options: [
          { key: 'A', text: 'Plain XML' },
          { key: 'B', text: 'BSON (Binary JSON)' },
          { key: 'C', text: 'YAML' },
          { key: 'D', text: 'Protocol Buffers' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'When is embedding documents preferred over referencing in MongoDB schema design?',
        options: [
          { key: 'A', text: 'When child data grows unboundedly and exceeds the 16MB document size limit' },
          { key: 'B', text: 'When child data is small, frequently accessed together with the parent, and has 1-to-Few relationship' },
          { key: 'C', text: 'When child data needs to be shared across many independent collections' },
          { key: 'D', text: 'When referencing is completely unsupported by Mongoose' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'How is a compound unique index defined in Mongoose to prevent duplicate records (e.g. employee + course)?',
        options: [
          { key: 'A', text: '`schema.index({ employee: 1, course: 1 }, { unique: true });`' },
          { key: 'B', text: '`schema.setUnique([\"employee\", \"course\"]);`' },
          { key: 'C', text: '`schema.addConstraint(\"UNIQUE(employee, course)\");`' },
          { key: 'D', text: '`schema.virtual(\"unique\").get();`' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'What is the maximum BSON document size permitted in MongoDB?',
        options: [
          { key: 'A', text: '2 MB' },
          { key: 'B', text: '8 MB' },
          { key: 'C', text: '16 MB' },
          { key: 'D', text: '64 MB' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'Which aggregation pipeline stage filters documents similar to a SQL WHERE clause?',
        options: [
          { key: 'A', text: '$project' },
          { key: 'B', text: '$match' },
          { key: 'C', text: '$group' },
          { key: 'D', text: '$unwind' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What Mongoose method is used to replace an ObjectId reference with the actual populated document from another collection?',
        options: [
          { key: 'A', text: '`join()`' },
          { key: 'B', text: '`populate()`' },
          { key: 'C', text: '`include()`' },
          { key: 'D', text: '`attach()`' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'In a MERN stack application, how does the React frontend securely authenticate API requests?',
        options: [
          { key: 'A', text: 'By passing the raw database connection string in the request body' },
          { key: 'B', text: 'By attaching a signed JWT in the `Authorization: Bearer <token>` header' },
          { key: 'C', text: 'By sending the user\'s plain password on every GET request' },
          { key: 'D', text: 'By hardcoding IP addresses into the frontend bundle' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'Which password hashing library is standard in Node.js for securely salting and hashing user passwords?',
        options: [
          { key: 'A', text: 'md5' },
          { key: 'B', text: 'sha1' },
          { key: 'C', text: 'bcryptjs' },
          { key: 'D', text: 'base64' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What aggregation stage in MongoDB deconstructs an array field from input documents to output a document for each element?',
        options: [
          { key: 'A', text: '$split' },
          { key: 'B', text: '$unwind' },
          { key: 'C', text: '$explode' },
          { key: 'D', text: '$flatten' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What is the role of Mongoose Middleware (pre/post hooks)?',
        options: [
          { key: 'A', text: 'To render HTML pages in the client browser' },
          { key: 'B', text: 'To execute custom logic automatically before or after operations like `save`, `validate`, or `remove`' },
          { key: 'C', text: 'To balance HTTP request traffic' },
          { key: 'D', text: 'To compress static images on disk' }
        ],
        correctAnswers: ['B'],
        marks: 2
      }
    ]
  },
  {
    title: 'Software Engineering and Computer Networks',
    courseTitle: 'Software Engineering and Computer Networks',
    description: 'Assessment covering SDLC, Agile Scrum, SOLID design principles, OSI 7-layer model, TCP vs UDP, DNS, and TLS/HTTPS.',
    passingPercentage: 70,
    timeLimitMinutes: 30,
    questions: [
      {
        order: 1,
        questionText: 'Which layer of the OSI 7-layer model is responsible for end-to-end reliable transmission and flow control (e.g. TCP)?',
        options: [
          { key: 'A', text: 'Layer 2 - Data Link Layer' },
          { key: 'B', text: 'Layer 3 - Network Layer' },
          { key: 'C', text: 'Layer 4 - Transport Layer' },
          { key: 'D', text: 'Layer 7 - Application Layer' }
        ],
        correctAnswers: ['C'],
        marks: 2
      },
      {
        order: 2,
        questionText: 'What three packets are exchanged during the standard TCP Three-Way Handshake?',
        options: [
          { key: 'A', text: 'PING, PONG, ACK' },
          { key: 'B', text: 'SYN, SYN-ACK, ACK' },
          { key: 'C', text: 'HELO, EHLO, OK' },
          { key: 'D', text: 'GET, POST, 200 OK' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 3,
        questionText: 'What is the core difference between TCP and UDP protocols?',
        options: [
          { key: 'A', text: 'TCP is connectionless while UDP is connection-oriented' },
          { key: 'B', text: 'TCP guarantees ordered, error-checked delivery while UDP is lightweight and connectionless' },
          { key: 'C', text: 'UDP can only send encrypted text' },
          { key: 'D', text: 'TCP cannot be used over IPv4 networks' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 4,
        questionText: 'In the SOLID design principles, what does the "O" represent?',
        options: [
          { key: 'A', text: 'Object-Oriented Programming' },
          { key: 'B', text: 'Open/Closed Principle (open for extension, closed for modification)' },
          { key: 'C', text: 'Optimized Code Execution' },
          { key: 'D', text: 'Operational Consistency' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 5,
        questionText: 'What is the primary role of the Domain Name System (DNS)?',
        options: [
          { key: 'A', text: 'To encrypt HTTP response headers' },
          { key: 'B', text: 'To translate human-readable domain names (e.g. skilltrack.demo) into machine-routable IP addresses' },
          { key: 'C', text: 'To compress HTML and CSS files on web servers' },
          { key: 'D', text: 'To manage database schema migrations' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 6,
        questionText: 'What happens during a TLS/HTTPS handshake before symmetric session data encryption begins?',
        options: [
          { key: 'A', text: 'The client and server authenticate each other using certificates and exchange a shared symmetric session key' },
          { key: 'B', text: 'All data is sent as plain unencrypted text' },
          { key: 'C', text: 'The browser restarts the operating system network stack' },
          { key: 'D', text: 'A new IP address is assigned to the web server' }
        ],
        correctAnswers: ['A'],
        marks: 2
      },
      {
        order: 7,
        questionText: 'Which Agile framework organizes work into fixed-length iterations called Sprints (typically 1-4 weeks)?',
        options: [
          { key: 'A', text: 'Waterfall model' },
          { key: 'B', text: 'Scrum' },
          { key: 'C', text: 'V-Model' },
          { key: 'D', text: 'Big Bang model' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 8,
        questionText: 'In Clean Architecture and SOLID, what does the Dependency Inversion Principle state?',
        options: [
          { key: 'A', text: 'High-level modules should depend directly on concrete low-level details' },
          { key: 'B', text: 'High-level modules should not depend on low-level modules; both should depend upon abstractions' },
          { key: 'C', text: 'Classes should contain at least 10 dependencies' },
          { key: 'D', text: 'Circular dependencies are encouraged for fast lookups' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 9,
        questionText: 'What is the primary objective of Continuous Integration (CI)?',
        options: [
          { key: 'A', text: 'To manually copy build files to FTP servers at midnight' },
          { key: 'B', text: 'To frequently merge developer code changes into a shared repository, verified by automated builds and tests' },
          { key: 'C', text: 'To eliminate the need for version control' },
          { key: 'D', text: 'To prevent developers from running unit tests locally' }
        ],
        correctAnswers: ['B'],
        marks: 2
      },
      {
        order: 10,
        questionText: 'What is the default TCP port number used for secure HTTPS web traffic?',
        options: [
          { key: 'A', text: '21' },
          { key: 'B', text: '80' },
          { key: 'C', text: '443' },
          { key: 'D', text: '8080' }
        ],
        correctAnswers: ['C'],
        marks: 2
      }
    ]
  }
];

module.exports = assessmentData;
