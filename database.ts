import fs from "fs";
import path from "path";

export interface Student {
  student_id: string;
  full_name: string;
  class_level: string;
  department: string;
  email: string;
  phone_number: string;
  photo: string;
  created_at?: string;
}

export interface Database {
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  run(sql: string, params?: any[]): Promise<any>;
  exec(sql: string): Promise<any>;
}

class emulatedDatabase implements Database {
  private filePath: string;
  private students: Student[] = [];

  constructor(filename: string) {
    // Change any .db extensions to .json for clear emulated storage
    const parsedPath = path.parse(filename);
    this.filePath = path.join(parsedPath.dir, `${parsedPath.name}.json`);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        this.students = JSON.parse(data);
      } else {
        this.students = [];
        this.save();
      }
    } catch (err) {
      console.error("Error loading JSON database:", err);
      this.students = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.students, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving JSON database:", err);
    }
  }

  async exec(sql: string): Promise<any> {
    const query = sql.trim().toUpperCase();
    if (query.startsWith("DROP TABLE")) {
      this.students = [];
      this.save();
    }
    // Creation statement is a no-op as the JSON structure automatically conforms
    return {};
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const query = sql.trim();
    
    // 1. SELECT COUNT
    if (query.toLowerCase().includes("select count(*)")) {
      const filtered = this.filterList(query, params);
      return { count: filtered.length };
    }

    // 2. Fetch single student ID check
    if (query.toLowerCase().includes("select student_id from students")) {
      const idToCheck = params[0];
      const found = this.students.find(s => s.student_id === idToCheck);
      return found ? { student_id: found.student_id } : undefined;
    }

    // 3. Fetch full student record
    if (query.toLowerCase().includes("select * from students")) {
      const idToCheck = params[0];
      const found = this.students.find(s => s.student_id === idToCheck);
      return found ? { ...found } : undefined;
    }

    return undefined;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const query = sql.trim();

    // 1. Distinct Departments
    if (query.toLowerCase().includes("select distinct department")) {
      const depts = Array.from(new Set(this.students.map(s => s.department).filter(Boolean)))
        .sort();
      return depts.map(d => ({ department: d }));
    }

    // 2. Distinct Class Levels
    if (query.toLowerCase().includes("select distinct class_level")) {
      const cls = Array.from(new Set(this.students.map(s => s.class_level).filter(Boolean)))
        .sort();
      return cls.map(c => ({ class_level: c }));
    }

    // 3. Duplicate Email groups check (for integrity checks)
    if (query.toLowerCase().includes("select email, count(*)")) {
      const emailCounts: Record<string, number> = {};
      this.students.forEach(s => {
        if (s.email && s.email.trim() !== '') {
          emailCounts[s.email] = (emailCounts[s.email] || 0) + 1;
        }
      });
      return Object.entries(emailCounts)
        .filter(([_, count]) => count > 1)
        .map(([email, count]) => ({ email, count }));
    }

    // 4. Duplicate matching students detail list
    if (query.toLowerCase().includes("select student_id, full_name, email, department from students where email = ?")) {
      const targetEmail = params[0];
      return this.students
        .filter(s => s.email === targetEmail)
        .map(s => ({
          student_id: s.student_id,
          full_name: s.full_name,
          email: s.email,
          department: s.department
        }));
    }

    // 5. Incomplete contact records checker
    if (query.toLowerCase().includes("or department is null")) {
      return this.students.filter(s => 
        !s.full_name || s.full_name.trim() === '' ||
        !s.email || s.email.trim() === '' ||
        !s.phone_number || s.phone_number.trim() === '' ||
        !s.class_level || s.class_level.trim() === '' ||
        !s.department || s.department.trim() === ''
      );
    }

    // 6. Format issue check (invalid email format)
    if (query.toLowerCase().includes("email not like")) {
      return this.students.filter(s => {
        if (!s.email || s.email.trim() === '') return false;
        const atIdx = s.email.indexOf('@');
        if (atIdx === -1) return true;
        const dotIdx = s.email.indexOf('.', atIdx);
        return dotIdx === -1;
      }).map(s => ({
        student_id: s.student_id,
        full_name: s.full_name,
        email: s.email
      }));
    }

    // 7. General search list (paginated, sorted, filtered)
    let filtered = this.filterAndSortList(query, params);
    return filtered;
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    const query = sql.trim().toLowerCase();

    // 1. INSERT INTO students
    if (query.startsWith("insert into students")) {
      const [student_id, full_name, class_level, department, email, phone_number, photo] = params;
      // Prevent duplicates in emulated push
      const idx = this.students.findIndex(s => s.student_id === student_id);
      const studentObj: Student = {
        student_id,
        full_name,
        class_level,
        department,
        email,
        phone_number,
        photo,
        created_at: new Date().toISOString()
      };
      if (idx !== -1) {
        this.students[idx] = studentObj;
      } else {
        this.students.push(studentObj);
      }
      this.save();
      return { lastID: student_id, changes: 1 };
    }

    // 2. UPDATE students
    if (query.startsWith("update students")) {
      const [student_id, full_name, class_level, department, email, phone_number, photo, originalId] = params;
      const idx = this.students.findIndex(s => s.student_id === originalId);
      if (idx !== -1) {
        this.students[idx] = {
          ...this.students[idx],
          student_id,
          full_name,
          class_level,
          department,
          email,
          phone_number,
          photo
        };
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    // 3. DELETE students
    if (query.startsWith("delete from students")) {
      const idToDelete = params[0];
      const initialLength = this.students.length;
      this.students = this.students.filter(s => s.student_id !== idToDelete);
      if (this.students.length !== initialLength) {
        this.save();
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    return { changes: 0 };
  }

  // Common list filter for count & SELECT
  private filterList(sql: string, params: any[]): Student[] {
    let filtered = [...this.students];
    let paramIndex = 0;

    if (sql.includes("(student_id LIKE ? OR full_name LIKE ?)")) {
      const rawSearch = params[paramIndex] || "";
      const searchTerm = typeof rawSearch === 'string' ? rawSearch.replace(/%/g, "").toLowerCase() : "";
      paramIndex += 2; // consume both search wildcard params
      if (searchTerm) {
        filtered = filtered.filter(s => 
          (s.student_id && s.student_id.toLowerCase().includes(searchTerm)) || 
          (s.full_name && s.full_name.toLowerCase().includes(searchTerm))
        );
      }
    }

    if (sql.includes("class_level = ?")) {
      const classLevelVal = params[paramIndex++];
      if (classLevelVal && classLevelVal !== "all") {
        filtered = filtered.filter(s => s.class_level === classLevelVal);
      }
    }

    if (sql.includes("department = ?")) {
      const departmentVal = params[paramIndex++];
      if (departmentVal && departmentVal !== "all") {
        filtered = filtered.filter(s => s.department === departmentVal);
      }
    }

    return filtered;
  }

  // Full filtering, sorting, limit and offset resolution
  private filterAndSortList(sql: string, params: any[]): Student[] {
    let filtered = this.filterList(sql, params);

    // 1. Handle ORDER BY sorting
    const matchOrder = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
    if (matchOrder) {
      const sortField = matchOrder[1];
      const isAsc = matchOrder[2].toUpperCase() === "ASC";
      filtered.sort((a, b) => {
        let valA = String(a[sortField as keyof Student] || "");
        let valB = String(b[sortField as keyof Student] || "");
        
        // Handle numerical/case-insensitive strings
        return isAsc 
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      });
    } else {
      // Default fallback by created_at DESC
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }

    // 2. Handle pagination offsets / limits
    const matchLimit = sql.match(/LIMIT\s+\?\s+OFFSET\s+\?/i);
    if (matchLimit) {
      const offsetValue = params[params.length - 1];
      const limitValue = params[params.length - 2];
      if (typeof offsetValue === 'number' && typeof limitValue === 'number') {
        filtered = filtered.slice(offsetValue, offsetValue + limitValue);
      }
    }

    return filtered;
  }
}

export async function open(config: { filename: string; driver?: any }): Promise<Database> {
  return new emulatedDatabase(config.filename);
}
