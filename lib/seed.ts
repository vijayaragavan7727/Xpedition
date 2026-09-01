import { ConceptMastery } from './store';

export interface SeededItem {
  id: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number; // IRT difficulty parameters spread -1.2 to +1.5
}

export const SEEDED_PYTHON_COURSE: {
  title: string;
  description: string;
  concepts: ConceptMastery[];
  items: SeededItem[];
} = {
  title: 'Python Core & Data Structures',
  description: 'Starter adaptive path covering fundamentals, memory management, and list comprehensions.',
  concepts: [
    {
      id: 'py-list-comp',
      name: 'List Comprehensions & Generators',
      masteryPercentage: 45,
      itemsNext: 4,
      retentionRisk: 0.15,
      ptsSinceCalibration: 12,
    },
    {
      id: 'py-dict-hashing',
      name: 'Dictionary Keys & Hashability',
      masteryPercentage: 30,
      itemsNext: 5,
      retentionRisk: 0.42,
      ptsSinceCalibration: 5,
    },
    {
      id: 'py-legb-scoping',
      name: 'LEGB Variable Scoping',
      masteryPercentage: 60,
      itemsNext: 3,
      retentionRisk: 0.10,
      ptsSinceCalibration: 20,
    },
    {
      id: 'py-memory-refs',
      name: 'Mutable vs Immutable References',
      masteryPercentage: 25,
      itemsNext: 6,
      retentionRisk: 0.38,
      ptsSinceCalibration: 8,
    },
  ],
  items: [
    {
      id: 'q1',
      conceptId: 'py-list-comp',
      conceptName: 'List Comprehensions & Generators',
      prompt: 'What is the key difference between `[x*2 for x in data]` and `(x*2 for x in data)` in Python?',
      options: [
        'Brackets return a tuple, while parentheses return a list.',
        'Brackets construct an in-memory list; parentheses return a lazy generator iterator.',
        'Parentheses execute faster because they utilize multithreading.',
        'Both construct identical list objects in memory.',
      ],
      correctIndex: 1,
      explanation: 'Square brackets create a list immediately in memory, whereas generator expressions with parentheses evaluate lazily on iteration.',
      difficulty: -1.2,
    },
    {
      id: 'q2',
      conceptId: 'py-dict-hashing',
      conceptName: 'Dictionary Keys & Hashability',
      prompt: 'Which of the following Python data structures CANNOT be used as a dictionary key?',
      options: [
        'A tuple containing numbers `(1, 2, 3)`',
        'A string `"user_id"`',
        'A list `[1, 2, 3]`',
        'A frozen set `frozenset([1, 2])`',
      ],
      correctIndex: 2,
      explanation: 'Lists are mutable and do not implement a static `__hash__` method, rendering them invalid dictionary keys.',
      difficulty: -0.8,
    },
    {
      id: 'q3',
      conceptId: 'py-memory-refs',
      conceptName: 'Mutable vs Immutable References',
      prompt: 'What is the result of evaluating `def append_item(val, target=[]): target.append(val); return target` called twice?',
      options: [
        'Each call returns a fresh single-element list `[val]`.',
        'The default list persists across calls, accumulating elements `[val1, val2]`.',
        'Python raises a SyntaxError for default mutable arguments.',
        'The second call overwrites the first element.',
      ],
      correctIndex: 1,
      explanation: 'Default arguments in Python are evaluated once when the function is defined, sharing the mutable list instance across calls.',
      difficulty: -0.4,
    },
    {
      id: 'q4',
      conceptId: 'py-dict-hashing',
      conceptName: 'Dictionary Keys & Hashability',
      prompt: 'What happens when two distinct objects return the same hash value in a Python dictionary lookup?',
      options: [
        'Python throws a HashCollisionException.',
        'The dictionary falls back to equality comparison (`__eq__`) to resolve collision buckets.',
        'The newest key overwrites the existing entry without checking value equality.',
        'The hash table dynamically reallocates memory to force unique hashes.',
      ],
      correctIndex: 1,
      explanation: 'Hash collisions in open-addressing hash tables are resolved by probing and comparing key equality via `__eq__`.',
      difficulty: -0.1,
    },
    {
      id: 'q5',
      conceptId: 'py-list-comp',
      conceptName: 'List Comprehensions & Generators',
      prompt: 'How do you inspect the current memory footprint of a generator expression vs a populated list?',
      options: [
        '`sys.getsizeof(gen_expr)` vs `sys.getsizeof(list_obj)`',
        '`len(gen_expr)` vs `len(list_obj)`',
        '`gen_expr.__len__()`',
        '`memoryview(gen_expr)`',
      ],
      correctIndex: 0,
      explanation: '`sys.getsizeof()` reports memory consumption in bytes, illustrating the constant memory size of generator objects.',
      difficulty: 0.2,
    },
    {
      id: 'q6',
      conceptId: 'py-legb-scoping',
      conceptName: 'LEGB Variable Scoping',
      prompt: 'In Python scoping rules (LEGB), what keyword allows an inner nested function to rebind a variable defined in an enclosing scope?',
      options: ['`global`', '`nonlocal`', '`outer`', '`super`'],
      correctIndex: 1,
      explanation: 'The `nonlocal` keyword allows rebinding of non-global variables in the nearest enclosing function scope.',
      difficulty: 0.5,
    },
    {
      id: 'q7',
      conceptId: 'py-legb-scoping',
      conceptName: 'LEGB Variable Scoping',
      prompt: 'In the LEGB lookup order, in what order does Python search namespaces for a variable name?',
      options: [
        'Local, Enclosing, Global, Built-in',
        'Local, Global, Enclosing, Built-in',
        'Global, Local, Enclosing, Built-in',
        'Enclosing, Local, Global, Built-in',
      ],
      correctIndex: 0,
      explanation: 'LEGB stands for Local, Enclosing (nonlocal), Global, and Built-in.',
      difficulty: 0.8,
    },
    {
      id: 'q8',
      conceptId: 'py-memory-refs',
      conceptName: 'Mutable vs Immutable References',
      prompt: 'Which of the following operations creates a shallow copy of a list `a = [1, [2, 3]]`?',
      options: [
        '`b = a.copy()`',
        '`b = copy.deepcopy(a)`',
        '`b = a`',
        '`b = list(map(lambda x: x, a))`',
      ],
      correctIndex: 0,
      explanation: '`a.copy()` or `a[:]` creates a shallow copy where nested mutable structures like `[2, 3]` are still shared.',
      difficulty: 1.0,
    },
    {
      id: 'q9',
      conceptId: 'py-dict-hashing',
      conceptName: 'Dictionary Keys & Hashability',
      prompt: 'Why are custom class instances hashable by default in Python unless `__eq__` is overridden without `__hash__`?',
      options: [
        'They inherit `__hash__` based on object identity (`id()`).',
        'Custom classes automatically serialize their properties to string hashes.',
        'Python converts object memory addresses into integers dynamically.',
        'Instances are not hashable by default.',
      ],
      correctIndex: 0,
      explanation: 'Default object instances use their memory identity for hashing and equality until `__eq__` is customized.',
      difficulty: 1.2,
    },
    {
      id: 'q10',
      conceptId: 'py-list-comp',
      conceptName: 'List Comprehensions & Generators',
      prompt: 'What exception is raised when calling `next()` on an exhausted generator iterator?',
      options: ['`StopIteration`', '`GeneratorExit`', '`IndexError`', '`IterationComplete`'],
      correctIndex: 0,
      explanation: 'Generators signal completion by raising `StopIteration`, which `for` loops automatically catch.',
      difficulty: 1.5,
    },
  ],
};
