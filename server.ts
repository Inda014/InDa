import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { open, Database } from "./database.ts";
import { createServer as createViteServer } from "vite";

// Support ES modules paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATABASE_FILE = path.join(process.cwd(), "database.db");

// Interface for Student Record
interface Student {
  student_id: string;
  full_name: string;
  class_level: string;
  department: string;
  email: string;
  phone_number: string;
  photo: string; // Base64 or elegant SVG data URL
  created_at?: string;
}

// Global database reference
let db: Database;
let simulatedLatencyMs = 0;

// Seed template SVG generator
function generateSeedAvatar(name: string, bgColor: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="54%" font-family="'Inter', sans-serif" font-weight="700" font-size="44" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Function to seed database with realistic records if empty
async function seedDatabase() {
  const countResult = await db.get("SELECT COUNT(*) as count FROM students");
  if (countResult && countResult.count > 0) {
    console.log("Database already contains data. Skipping seeding.");
    return;
  }

  console.log("Database is empty. Seeding student records...");

  const seedStudents: Student[] = [
    {
      student_id: "STU-2026-001",
      full_name: "Olivia Vance",
      class_level: "Senior",
      department: "Computer Science",
      email: "olivia.vance@university.edu",
      phone_number: "+1 (555) 019-2834",
      photo: generateSeedAvatar("Olivia Vance", "#4F46E5"), // Indigo
    },
    {
      student_id: "STU-2026-002",
      full_name: "Liam Chen",
      class_level: "Junior",
      department: "Data Science",
      email: "liam.chen@university.edu",
      phone_number: "+1 (555) 014-9876",
      photo: generateSeedAvatar("Liam Chen", "#0EA5E9"), // Sky Blue
    },
    {
      student_id: "STU-2026-003",
      full_name: "Sofia Rodriguez",
      class_level: "Senior",
      department: "Bio-Medical Engineering",
      email: "sofia.rod@university.edu",
      phone_number: "+1 (555) 012-4455",
      photo: generateSeedAvatar("Sofia Rodriguez", "#10B981"), // Emerald
    },
    {
      student_id: "STU-2026-004",
      full_name: "Marcus Aurelius",
      class_level: "Sophomore",
      department: "Philosophy & Humanities",
      email: "marcus.philosophy@university.edu",
      phone_number: "+1 (555) 018-1212",
      photo: generateSeedAvatar("Marcus Aurelius", "#D97706"), // Amber
    },
    {
      student_id: "STU-2026-005",
      full_name: "Amara Okoye",
      class_level: "Freshman",
      department: "Civil Engineering",
      email: "amara.okoye@university.edu",
      phone_number: "+1 (555) 017-8899",
      photo: generateSeedAvatar("Amara Okoye", "#EC4899"), // Pink
    },
    {
      student_id: "STU-2026-006",
      full_name: "Ethan Wright",
      class_level: "Junior",
      department: "Mechanical Engineering",
      email: "ethan.wright@university.edu",
      phone_number: "+1 (555) 013-3321",
      photo: generateSeedAvatar("Ethan Wright", "#8B5CF6"), // Purple
    },
    {
      student_id: "STU-2026-007",
      full_name: "Yuki Tanaka",
      class_level: "Senior",
      department: "Information Technology",
      email: "yuki.tanaka@university.edu",
      phone_number: "+1 (555) 011-7766",
      photo: generateSeedAvatar("Yuki Tanaka", "#EF4444"), // Red
    },
    {
      student_id: "STU-2026-008",
      full_name: "Gabriel Dupont",
      class_level: "Sophomore",
      department: "Mathematics & Statistics",
      email: "gabriel.dupont@university.edu",
      phone_number: "+1 (555) 015-4422",
      photo: generateSeedAvatar("Gabriel Dupont", "#14B8A6"), // Teal
    },
    {
      student_id: "STU-2026-009",
      full_name: "Zoe Jenkins",
      class_level: "Freshman",
      department: "Computer Science",
      email: "zoe.jenkins@university.edu",
      phone_number: "+1 (555) 016-5533",
      photo: generateSeedAvatar("Zoe Jenkins", "#6366F1"), // Indigo
    },
    {
      student_id: "STU-2026-010",
      full_name: "Alexander Mercer",
      class_level: "Junior",
      department: "Cyber Security",
      email: "alex.mercer@university.edu",
      phone_number: "+1 (555) 019-9944",
      photo: generateSeedAvatar("Alexander Mercer", "#06B6D4"), // Cyan
    },
    {
      student_id: "STU-2026-011",
      full_name: "Chloe Sterling",
      class_level: "Senior",
      department: "Chemistry & Physics",
      email: "chloe.sterling@university.edu",
      phone_number: "+1 (555) 011-2299",
      photo: generateSeedAvatar("Chloe Sterling", "#F59E0B"), // Amber
    },
    {
      student_id: "STU-2026-012",
      full_name: "Devon Miller",
      class_level: "Sophomore",
      department: "Aerospace Engineering",
      email: "devon.miller@university.edu",
      phone_number: "+1 (555) 018-7711",
      photo: generateSeedAvatar("Devon Miller", "#84CC16"), // Lime
    }
  ];

  for (const stu of seedStudents) {
    await db.run(
      `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        stu.student_id,
        stu.full_name,
        stu.class_level,
        stu.department,
        stu.email,
        stu.phone_number,
        stu.photo,
      ]
    );
  }
  console.log("Database successfully seeded with 12 records!");
}

// Backend express starting framework
async function initBackend() {
  // Setup SQLite Database connection and create tables
  db = await open({
    filename: DATABASE_FILE,
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      student_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      class_level TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      photo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedDatabase();

  const app = express();

  // Increase payload limit to support standard custom Base64 image transfers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Global administrative artificial latency simulated middleware
  app.use(async (req, res, next) => {
    if (simulatedLatencyMs > 0 && req.path.startsWith("/api/")) {
      await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
    }
    next();
  });

  // API ROUTE: Get paginated student list with optional filtering and sorting
  app.get("/api/students", async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
      const offset = (page - 1) * limit;

      const search = (req.query.search as string || "").trim();
      const classLevel = (req.query.classLevel as string || "all").trim();
      const department = (req.query.department as string || "all").trim();
      
      const sortBy = (req.query.sortBy as string || "created_at").trim();
      const sortOrder = (req.query.sortOrder as string || "DESC").trim().toUpperCase() === "ASC" ? "ASC" : "DESC";

      let queryConditions = ["1=1"];
      let queryParams: any[] = [];

      if (search) {
        queryConditions.push("(student_id LIKE ? OR full_name LIKE ?)");
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (classLevel && classLevel !== "all") {
        queryConditions.push("class_level = ?");
        queryParams.push(classLevel);
      }

      if (department && department !== "all") {
        queryConditions.push("department = ?");
        queryParams.push(department);
      }

      const whereClause = queryConditions.join(" AND ");

      // Get count
      const countQuery = `SELECT COUNT(*) as count FROM students WHERE ${whereClause}`;
      const countResult = await db.get(countQuery, queryParams);
      const totalCount = countResult ? countResult.count : 0;

      // Whitelist columns to resolve safely
      const allowedSortColumns = ["student_id", "full_name", "department", "class_level", "created_at"];
      const sortField = allowedSortColumns.includes(sortBy) ? sortBy : "created_at";

      // Get results
      const selectQuery = `SELECT * FROM students WHERE ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
      const students = await db.all(selectQuery, [...queryParams, limit, offset]);

      res.json({
        success: true,
        students,
        totalCount,
        page,
        pagesCount: Math.ceil(totalCount / limit),
      });
    } catch (err: any) {
      console.error("Error fetching students:", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // API ROUTE: Get departments and class levels for dynamic filters
  app.get("/api/filters", async (req, res) => {
    try {
      const departments = await db.all("SELECT DISTINCT department FROM students ORDER BY department ASC");
      const classes = await db.all("SELECT DISTINCT class_level FROM students ORDER BY class_level ASC");
      res.json({
        success: true,
        departments: departments.map((d) => d.department),
        classes: classes.map((c) => c.class_level),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // API ROUTE: Run sync/database integrity metrics check
  app.get("/api/integrity", async (req, res) => {
    try {
      // 1. Find all duplicate emails
      const duplicateEmailsResult = await db.all(
        `SELECT email, COUNT(*) as count 
         FROM students 
         WHERE email IS NOT NULL AND email != '' 
         GROUP BY email 
         HAVING count > 1`
      );

      const duplicatesList = [];
      for (const row of duplicateEmailsResult) {
        const matchingStudents = await db.all(
          `SELECT student_id, full_name, email, department FROM students WHERE email = ?`,
          [row.email]
        );
        duplicatesList.push({
          email: row.email,
          count: row.count,
          students: matchingStudents
        });
      }

      // 2. Find missing required fields or invalid emails
      const incompleteStudents = await db.all(
        `SELECT student_id, full_name, email, phone_number, class_level, department 
         FROM students 
         WHERE full_name IS NULL OR full_name = '' 
            OR email IS NULL OR email = '' 
            OR phone_number IS NULL OR phone_number = '' 
            OR class_level IS NULL OR class_level = '' 
            OR department IS NULL OR department = ''`
      );

      // 3. Find format issues (invalid emails)
      const formatIssues = await db.all(
        `SELECT student_id, full_name, email 
         FROM students 
         WHERE email NOT LIKE '%@%.%' AND email != '' AND email IS NOT NULL`
      );

      const totalIssues = duplicatesList.length + incompleteStudents.length + formatIssues.length;
      const integrityScore = Math.max(0, 100 - (duplicatesList.length * 8 + incompleteStudents.length * 6 + formatIssues.length * 4));

      res.json({
        success: true,
        duplicates: duplicatesList,
        incomplete: incompleteStudents,
        formatIssues: formatIssues,
        integrityScore,
        totalIssues
      });
    } catch (err: any) {
      console.error("Integrity check error:", err);
      res.status(500).json({ success: false, error: err.message || "Integrity scan failure" });
    }
  });

  // API ROUTE: Admin-triggered reseed script to clear and reload seed dataset
  app.post("/api/reseed", async (req, res) => {
    try {
      await db.exec("DROP TABLE IF EXISTS students");
      await db.exec(`
        CREATE TABLE IF NOT EXISTS students (
          student_id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          class_level TEXT NOT NULL,
          department TEXT NOT NULL,
          email TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          photo TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await seedDatabase();
      res.json({ success: true, message: "Database re-seeded successfully with 12 clean records!" });
    } catch (err: any) {
      console.error("Reseed failure:", err);
      res.status(500).json({ success: false, error: err.message || "Reseed failure" });
    }
  });

  // API ROUTE: Get admin system variables and settings
  app.get("/api/admin/config", async (req, res) => {
    try {
      const countResult = await db.get("SELECT COUNT(*) as count FROM students");
      const totalCount = countResult ? countResult.count : 0;
      res.json({
        success: true,
        simulatedLatencyMs,
        dbType: "SQLite Emulated DB File (JSON Storage Hub)",
        totalCount
      });
    } catch {
      res.status(500).json({ success: false, error: "Failed to load admin stats" });
    }
  });

  // API ROUTE: Update admin system variables and settings (e.g. artificial delay)
  app.post("/api/admin/config", async (req, res) => {
    try {
      const { latency } = req.body;
      if (typeof latency === "number") {
        simulatedLatencyMs = Math.max(0, Math.min(10000, latency));
        res.json({ success: true, simulatedLatencyMs, message: `System network latency simulated to ${simulatedLatencyMs}ms` });
      } else {
        res.status(400).json({ success: false, error: "Invalid latency parameter" });
      }
    } catch {
      res.status(500).json({ success: false, error: "Failed to update configuration" });
    }
  });

  // API ROUTE: Clear database database completely (Nuclear administrative delete)
  app.post("/api/admin/nuke", async (req, res) => {
    try {
      await db.exec("DROP TABLE IF EXISTS students");
      await db.exec(`
        CREATE TABLE IF NOT EXISTS students (
          student_id TEXT PRIMARY KEY,
          full_name TEXT NOT NULL,
          class_level TEXT NOT NULL,
          department TEXT NOT NULL,
          email TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          photo TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      res.json({ success: true, message: "Database completely cleared of all information." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Nuke failed" });
    }
  });

  // API ROUTE: Inject testing faults to verify Integrity diagnostics
  app.post("/api/admin/inject-fault", async (req, res) => {
    try {
      const { faultType } = req.body;
      const idSuffix = Math.floor(100 + Math.random() * 900);
      
      if (faultType === "duplicate") {
        // Double emails: Injects 2 separate students with exactly the same email
        const targetEmail = "double.student@academicus.edu";
        
        await db.run(
          `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            `STU-FLT-A${idSuffix}`,
            "Clara Oswald (Simulated Duplicate)",
            "Senior",
            "Philosophy & Humanities",
            targetEmail,
            "+1 (555) 077-8899",
            generateSeedAvatar("Clara Oswald", "#D97706")
          ]
        );

        await db.run(
          `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            `STU-FLT-B${idSuffix}`,
            "Gideon Cross (Simulated Duplicate)",
            "Junior",
            "Computer Science",
            targetEmail,
            "+1 (555) 011-2233",
            generateSeedAvatar("Gideon Cross", "#10B981")
          ]
        );

        return res.json({ success: true, message: "Injected 2 records with duplicate emails successfully!" });

      } else if (faultType === "missing") {
        // Empty critical values
        await db.run(
          `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            `STU-FLT-C${idSuffix}`,
            "Anonymous Student",
            "", // empty class level
            "Civil Engineering",
            "anon@academicus.edu",
            "", // empty phone number
            generateSeedAvatar("Anonymous Student", "#EF4444")
          ]
        );
        return res.json({ success: true, message: "Injected incomplete profile record successfully!" });

      } else if (faultType === "format") {
        // Bad RFC email pattern (missing @ symbol or dot)
        await db.run(
          `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            `STU-FLT-D${idSuffix}`,
            "Jonathan Harker (Format Issue)",
            "Freshman",
            "Information Technology",
            "jonathan.harker.invalid-format", // Invalid email format
            "+1 (555) 012-3456",
            generateSeedAvatar("Jonathan Harker", "#8B5CF6")
          ]
        );
        return res.json({ success: true, message: "Injected malformed email address successfully!" });
      }

      res.status(400).json({ success: false, error: "Unknown fault type" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to inject error" });
    }
  });

  // API ROUTE: Bulk seed generation of clean randomized records
  app.post("/api/admin/inject-bulk", async (req, res) => {
    try {
      const count = Math.max(1, Math.min(100, parseInt(req.body.count) || 10));
      
      const firstNames = ["James", "Lucas", "Emily", "Mia", "Ethan", "Aria", "Noah", "Sophia", "Oliver", "Grace", "Liam", "Yuki", "Chloe", "Alexander", "Isabella", "Benjamin", "Charlotte", "Daniel", "Amara", "Gabriel"];
      const lastNames = ["Sterling", "Brooks", "Chen", "Hawthorne", "Okoye", "Wright", "Tanaka", "Mendoza", "Dupont", "Jenkins", "Mercer", "Prior", "Valdez", "Zhang", "Chase", "Solis", "Finch", "Cross", "Oswald", "Vance"];
      const deptsList = ["Computer Science", "Mechanical Engineering", "Bio-Medical Engineering", "Civil Engineering", "Philosophy & Humanities", "Information Technology", "Mathematics & Statistics", "Data Science"];
      const levelsList = ["Freshman", "Sophomore", "Junior", "Senior"];
      const colors = ["#4F46E5", "#0EA5E9", "#10B981", "#D97706", "#EC4899", "#8B5CF6", "#EF4444", "#14B8A6", "#6366F1", "#06B6D4"];

      for (let i = 0; i < count; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${fn} ${ln}`;
        const dept = deptsList[Math.floor(Math.random() * deptsList.length)];
        const lvl = levelsList[Math.floor(Math.random() * levelsList.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const randomId = `STU-GEN-${Math.floor(1000 + Math.random() * 9000)}`;
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@university.edu`;
        const phone = `+1 (555) 01${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const photo = generateSeedAvatar(fullName, color);

        // Check if ID already exists, if so skip or overwrite
        await db.run(
          `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [randomId, fullName, lvl, dept, email, phone, photo]
        );
      }

      res.json({ success: true, message: `Successfully loaded ${count} simulated student records into the registry!` });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message || "Failed bulk generation" });
    }
  });

  // API ROUTE: Export all students as CSV
  app.get("/api/export", async (req, res) => {
    try {
      const students = await db.all("SELECT student_id, full_name, class_level, department, email, phone_number, created_at FROM students ORDER BY student_id ASC");
      
      // Construct CSV manually
      const headers = ["Student ID", "Full Name", "Class/Level", "Department", "Email", "Phone Number", "Enrollment Date"];
      const escapeCSVField = (field: string) => {
        if (!field) return '""';
        const str = String(field).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = students.map((s) => [
        escapeCSVField(s.student_id),
        escapeCSVField(s.full_name),
        escapeCSVField(s.class_level),
        escapeCSVField(s.department),
        escapeCSVField(s.email),
        escapeCSVField(s.phone_number),
        escapeCSVField(s.created_at || ""),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=student_records.csv");
      res.status(200).send(csvContent);
    } catch (err) {
      res.status(500).send("Error exporting CSV");
    }
  });

  // API ROUTE: Get single student by ID
  app.get("/api/students/:student_id", async (req, res) => {
    try {
      const { student_id } = req.params;
      const student = await db.get("SELECT * FROM students WHERE student_id = ?", [student_id]);
      if (!student) {
        return res.status(404).json({ success: false, error: "Student not found" });
      }
      res.json({ success: true, student });
    } catch (err) {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // API ROUTE: Create student record (Form validation handled server side as well)
  app.post("/api/students", async (req, res) => {
    try {
      const { student_id, full_name, class_level, department, email, phone_number, photo } = req.body;

      // Validation
      if (!student_id || !full_name || !class_level || !department || !email || !phone_number) {
        return res.status(400).json({ success: false, error: "Please fulfill all required fields." });
      }

      // Format cleanups & patterns
      const idPattern = /^[a-zA-Z0-9\-_]+$/;
      if (!idPattern.test(student_id)) {
        return res.status(400).json({ success: false, error: "Student ID can only contain alphanumeric characters, hyphens, and underscores." });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, error: "Please enter a valid email address." });
      }

      // Check uniqueness of Student ID
      const existing = await db.get("SELECT student_id FROM students WHERE student_id = ?", [student_id]);
      if (existing) {
        return res.status(400).json({ success: false, error: `Student ID '${student_id}' is already registered.` });
      }

      // Default photo if empty
      const resolvedPhoto = photo || generateSeedAvatar(full_name, "#6B7280");

      await db.run(
        `INSERT INTO students (student_id, full_name, class_level, department, email, phone_number, photo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [student_id, full_name, class_level, department, email, phone_number, resolvedPhoto]
      );

      const createdStudent = await db.get("SELECT * FROM students WHERE student_id = ?", [student_id]);
      res.status(201).json({ success: true, student: createdStudent });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
    }
  });

  // API ROUTE: Edit student record
  app.put("/api/students/:student_id", async (req, res) => {
    try {
      const originalId = req.params.student_id;
      const { student_id, full_name, class_level, department, email, phone_number, photo } = req.body;

      if (!student_id || !full_name || !class_level || !department || !email || !phone_number) {
        return res.status(400).json({ success: false, error: "Please fulfill all required fields." });
      }

      const idPattern = /^[a-zA-Z0-9\-_]+$/;
      if (!idPattern.test(student_id)) {
        return res.status(400).json({ success: false, error: "Student ID can only contain letters, numbers, hyphens, and underscores." });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, error: "Please enter a valid email address." });
      }

      // Verify the target student exists
      const targetStudent = await db.get("SELECT student_id FROM students WHERE student_id = ?", [originalId]);
      if (!targetStudent) {
        return res.status(404).json({ success: false, error: "Target student not found." });
      }

      // ID changes must verify target ID uniqueness
      if (student_id !== originalId) {
        const matchingIdRecord = await db.get("SELECT student_id FROM students WHERE student_id = ?", [student_id]);
        if (matchingIdRecord) {
          return res.status(400).json({ success: false, error: `Cannot update. Student ID '${student_id}' is already taken by another student.` });
        }
      }

      const resolvedPhoto = photo || generateSeedAvatar(full_name, "#6B7280");

      await db.run(
        `UPDATE students 
         SET student_id = ?, full_name = ?, class_level = ?, department = ?, email = ?, phone_number = ?, photo = ?
         WHERE student_id = ?`,
        [student_id, full_name, class_level, department, email, phone_number, resolvedPhoto, originalId]
      );

      const updatedStudent = await db.get("SELECT * FROM students WHERE student_id = ?", [student_id]);
      res.json({ success: true, student: updatedStudent });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
    }
  });

  // API ROUTE: Delete student record
  app.delete("/api/students/:student_id", async (req, res) => {
    try {
      const { student_id } = req.params;
      const targetStudent = await db.get("SELECT student_id FROM students WHERE student_id = ?", [student_id]);
      if (!targetStudent) {
        return res.status(404).json({ success: false, error: "Student not found." });
      }

      await db.run("DELETE FROM students WHERE student_id = ?", [student_id]);
      res.json({ success: true, message: `Student '${student_id}' deleted successfully.` });
    } catch (err) {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // Incorporating Vite compilation or Dev Servers
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA routing standard for React router/vite fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student record system listening on http://localhost:${PORT}`);
  });
}

initBackend().catch((err) => {
  console.error("Critical: Failed to initialize backend server", err);
});
