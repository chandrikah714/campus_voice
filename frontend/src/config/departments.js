// Single source of truth for department names.
//
// Previously Register.jsx and ReportIssue.jsx each hardcoded their own list,
// and the values didn't match ("Information Technology" vs "IT", plus a
// "Maintainence" typo). That meant a staff member registered under
// "Information Technology" would never see complaints filed under "IT" —
// they'd silently never show up on that staff member's dashboard.
// Everything now imports from here instead.
export const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Biotechnology",
  "Maintenance",
];
