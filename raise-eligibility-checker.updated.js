/**
 * Raise eligibility checker (updated for the new API spec).
 *
 * Eligibility criteria:
 * 1) Employee has completed all required trainings that apply to them
 * 2) Hire date was at least 90 days ago
 * 3) Average performance rating is at least 4.0 on a 1–5 scale
 *
 * Notes about the API:
 * - Employees:     GET /GetEmployees?_id=<ObjectId>
 * - Performance:   GET /GetPerformanceRatings?employee_id=<ObjectId>
 * - Training:      GET /GetTrainingStatus?employee_id=<ObjectId>
 *
 * The API returns lists. This module tolerates slight variations in shape.
 * Adjust API_PREFIX below if your backend is mounted under a prefix like "/api".
 */

/** Optional API prefix. Use "" if routes are mounted at the root. */
const API_PREFIX = ""; // e.g. "/api" if your server uses that path

/** Build a URL with query parameters. */
function buildUrl(path, params = {}) {
  const url = new URL((API_PREFIX || "") + path, typeof window !== "undefined" ? window.location.origin : "http://localhost");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

/**
 * Main entry
 * @param {string} employeeId MongoDB ObjectId of the employee
 * @returns {Promise<boolean>}
 */
async function isEmployeeEligibleForRaise(employeeId) {
  try {
    const [employee, trainings, performances] = await Promise.all([
      fetchEmployeeById(employeeId),
      fetchTrainingStatusByEmployeeId(employeeId),
      fetchPerformanceRatingsByEmployeeId(employeeId),
    ]);

    if (!employee) {
      console.warn(`Employee with id ${employeeId} not found`);
      return false;
    }

    const hasCompleteTraining = checkTrainingCompleteForEmployee(trainings, employeeId);
    const hasMinimumTenure = checkMinimumTenure(employee.hire_date);
    const hasGoodPerformance = checkAveragePerformance(performances, 4.0);

    console.log(`Eligibility ${employeeId}`, { hasCompleteTraining, hasMinimumTenure, hasGoodPerformance });

    return Boolean(hasCompleteTraining && hasMinimumTenure && hasGoodPerformance);
  } catch (err) {
    console.error("Error computing eligibility", err);
    return false;
  }
}

/** Fetch a single employee by _id */
async function fetchEmployeeById(employeeId) {
  const url = buildUrl("/GetEmployees", { _id: employeeId });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GetEmployees failed: ${res.status}`);
  const data = await res.json();

  // The API says it returns a list; gracefully handle other shapes.
  if (Array.isArray(data)) return data[0] || null;
  if (Array.isArray(data.employees)) return data.employees[0] || null;
  // Fallback if the endpoint returns a single object
  if (data && typeof data === "object" && !Array.isArray(data)) return data;
  return null;
}

/** Fetch performance ratings for an employee */
async function fetchPerformanceRatingsByEmployeeId(employeeId) {
  const url = buildUrl("/GetPerformanceRatings", { employee_id: employeeId });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GetPerformanceRatings failed: ${res.status}`);
  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data["performance ratings"])) return data["performance ratings"];
  if (Array.isArray(data.performances)) return data.performances;
  return [];
}

/** Fetch training status records for an employee */
async function fetchTrainingStatusByEmployeeId(employeeId) {
  const url = buildUrl("/GetTrainingStatus", { employee_id: employeeId });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GetTrainingStatus failed: ${res.status}`);
  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data["training statuses"])) return data["training statuses"];
  if (Array.isArray(data.trainings)) return data.trainings;
  return [];
}

/**
 * Determine if the employee has completed the trainings required for them.
 * The training collection contains records of trainings and embedded participant records.
 * This function tries common shapes:
 * - record.participants / attendees / employees: Array<{ employee_id, status | training_status | complete }>
 * - status strings like "Complete", "Completed", "Passed"
 * - boolean flags like complete: true
 *
 * Rule:
 * - If a training record has required === true and includes this employee, the employee must be complete for that training.
 * - If there are no required trainings that include this employee, return true if any training that includes them is complete.
 */
function checkTrainingCompleteForEmployee(trainingRecords, employeeId) {
  if (!Array.isArray(trainingRecords) || trainingRecords.length === 0) return false;

  const statusIsComplete = (s) => {
    if (typeof s === "boolean") return s;
    if (s == null) return false;
    const t = String(s).toLowerCase();
    return t.includes("complete") || t.includes("completed") || t.includes("pass");
  };

  /** Given a training record, extract any participant entries for this employee. */
  const participantsFor = (rec) => {
    const maybeLists = [
      rec.participants,
      rec.attendees,
      rec.employees,
      rec.enrollments,
      rec.records,
    ].filter(Array.isArray);

    const flat = maybeLists.flat();
    return flat.filter((p) => {
      const pid =
        p.employee_id ||
        p.Employee_id ||
        p.emp_id ||
        p.employeeId ||
        (typeof p.employee === "object" ? p.employee?._id : p.employee);
      return pid && String(pid) === String(employeeId);
    });
  };

  const requiredRecords = trainingRecords.filter((r) => r && r.required === true);
  const requiredThatIncludeEmployee = requiredRecords.filter((r) => participantsFor(r).length > 0);

  if (requiredThatIncludeEmployee.length > 0) {
    // All required trainings that include the employee must be complete
    return requiredThatIncludeEmployee.every((r) => {
      const ps = participantsFor(r);
      return ps.some((p) => statusIsComplete(p.status || p.training_status || p.Training_status || p.complete));
    });
  }

  // Otherwise, allow any completed training that includes the employee
  return trainingRecords.some((r) => participantsFor(r).some((p) => statusIsComplete(p.status || p.training_status || p.Training_status || p.complete)));
}

/** Check if hire date is at least 90 days ago */
function checkMinimumTenure(hireDate) {
  if (!hireDate) return false;
  const d = new Date(hireDate);
  if (isNaN(d.getTime())) return false;
  const ms90 = 90 * 24 * 60 * 60 * 1000;
  return Date.now() - d.getTime() >= ms90;
}

/**
 * Average performance ratings on a 1–5 scale
 * @param {Array<{rating?: number|string, Rating?: number|string}>} performanceRatings
 * @param {number} threshold Minimum average required
 */
function checkAveragePerformance(performanceRatings, threshold = 4.0) {
  if (!Array.isArray(performanceRatings) || performanceRatings.length === 0) return false;
  const toScore = (v) => {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return null;
    return n > 5 ? n / 20 : n; // normalize 1–100 to 1–5
  };
  const values = performanceRatings
      .map(r => r.rating ?? r.Rating ?? r.score ?? r.value)
      .map(toScore)
      .filter(n => Number.isFinite(n));
  if (values.length === 0) return false;
  return (values.reduce((a,b)=>a+b,0) / values.length) >= threshold;
}

// Example usage helper
async function checkEmployeeRaise(employeeId) {
  try {
    const ok = await isEmployeeEligibleForRaise(employeeId);
    console.log(`Employee ${employeeId} is ${ok ? "eligible" : "not eligible"} for a raise`);
    return ok;
  } catch (e) {
    console.error("Failed to check eligibility", e);
    return false;
  }
}

// Export for modules if needed
// export { isEmployeeEligibleForRaise, checkEmployeeRaise };
