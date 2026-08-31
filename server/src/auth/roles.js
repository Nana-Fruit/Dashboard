// The 4 permission levels.
export const ROLES = {
  audit: "audit",     // ดูได้ทั้งหมด (office + factory), แก้ไขไม่ได้
  admin: "admin",     // ดู + แก้ไขได้ทั้งหมด
  office: "office",   // ดูได้เฉพาะฝั่ง Office
  factory: "factory", // ดูได้เฉพาะฝั่งโรงงาน
};

export const ROLE_LABEL = {
  audit: "Auditor",
  admin: "Admin",
  office: "Office",
  factory: "Factory",
};

export const canViewOffice = (role) => ["audit", "admin", "office"].includes(role);
export const canViewFactory = (role) => ["audit", "admin", "factory"].includes(role);
export const canEdit = (role) => role === "admin";

// Everything the frontend needs to decide what to render for this user.
export const permissionsFor = (role) => ({
  role,
  roleLabel: ROLE_LABEL[role] || role,
  viewOffice: canViewOffice(role),
  viewFactory: canViewFactory(role),
  edit: canEdit(role),
});
