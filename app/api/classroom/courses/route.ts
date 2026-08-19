import { NextResponse } from "next/server";

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  courseState?: string;
  courseWork?: string[];
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      // Query Google Classroom API with user's OAuth access token
      const coursesRes = await fetch("https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const rawCourses = coursesData.courses || [];

        const coursesWithWork: ClassroomCourse[] = await Promise.all(
          rawCourses.map(async (c: any) => {
            let titles: string[] = [];
            try {
              const workRes = await fetch(
                `https://classroom.googleapis.com/v1/courses/${c.id}/courseWork`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (workRes.ok) {
                const workData = await workRes.json();
                titles = (workData.courseWork || []).map((w: any) => w.title);
              }
            } catch (e) {
              console.warn(`Error fetching coursework for course ${c.id}:`, e);
            }

            return {
              id: c.id,
              name: c.name,
              section: c.section,
              descriptionHeading: c.descriptionHeading,
              courseState: c.courseState,
              courseWork: titles,
            };
          })
        );

        return NextResponse.json({ courses: coursesWithWork, isRealApi: true });
      }
    }

    // Fallback sample courses if no token or API unconfigured
    const sampleCourses: ClassroomCourse[] = [
      {
        id: "gc-101",
        name: "CS50: Introduction to Computer Science & Python",
        section: "Fall Semester",
        descriptionHeading: "Core Programming Fundamentals & Algorithms",
        courseWork: [
          "Problem Set 1: C & Python Syntax Basics",
          "Problem Set 2: Arrays & Memory Management",
          "Problem Set 3: Data Structures & Hash Tables",
          "Final Project: Web Applications with Next.js",
        ],
      },
      {
        id: "gc-202",
        name: "Data Structures & Algorithms Mastery",
        section: "Section B",
        descriptionHeading: "Advanced Problem Solving for Technical Interviews",
        courseWork: [
          "Assignment 1: Linked Lists & Double-Ended Queues",
          "Assignment 2: Binary Search Trees & AVL Trees",
          "Assignment 3: Graph Traversal (BFS & DFS)",
          "Midterm Exam: Dynamic Programming & Greedy Algorithms",
        ],
      },
      {
        id: "gc-[#303]",
        name: "Full Stack Web Development & System Design",
        section: "Spring Term",
        descriptionHeading: "Modern Web Engineering Practices",
        courseWork: [
          "Lab 1: RESTful APIs & Supabase Integration",
          "Lab 2: Microservices & Docker Containers",
          "Lab 3: Security, Authentication & OAuth 2.0",
        ],
      },
    ];

    return NextResponse.json({ courses: sampleCourses, isRealApi: false });
  } catch (err: any) {
    console.error("Google Classroom API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
