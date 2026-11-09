import { describe, it, expect } from "vitest";
import {
  canManageProjects,
  canSubmitProposal,
  canRecordKas,
  canAuditKas,
  canReviewProposal,
  canOpenTermin,
  hasAdminAccess,
} from "@/lib/use-current-role";

describe("Role Permissions Matrix", () => {
  it("allows PERANGKAT_DESA and ADMIN to manage projects and record kas", () => {
    expect(canManageProjects("PERANGKAT_DESA")).toBe(true);
    expect(canManageProjects("ADMIN")).toBe(true);
    expect(canManageProjects("WARGA")).toBe(false);
    expect(canManageProjects("PUBLIK")).toBe(false);

    expect(canRecordKas("PERANGKAT_DESA")).toBe(true);
    expect(canRecordKas("ADMIN")).toBe(true);
    expect(canRecordKas("PENGAWAS")).toBe(false);
  });

  it("allows WARGA and ADMIN to submit proposals", () => {
    expect(canSubmitProposal("WARGA")).toBe(true);
    expect(canSubmitProposal("ADMIN")).toBe(true);
    expect(canSubmitProposal("PERANGKAT_DESA")).toBe(false);
    expect(canSubmitProposal("PUBLIK")).toBe(false);
  });

  it("allows PENGAWAS and ADMIN to audit kas and open termin", () => {
    expect(canAuditKas("PENGAWAS")).toBe(true);
    expect(canAuditKas("ADMIN")).toBe(true);
    expect(canAuditKas("WARGA")).toBe(false);

    expect(canOpenTermin("PENGAWAS")).toBe(true);
    expect(canOpenTermin("ADMIN")).toBe(true);
    expect(canOpenTermin("PERANGKAT_DESA")).toBe(false);
  });

  it("correctly identifies admin access privileges", () => {
    expect(hasAdminAccess("PERANGKAT_DESA")).toBe(true);
    expect(hasAdminAccess("ADMIN")).toBe(true);
    expect(hasAdminAccess("PENGAWAS")).toBe(false);
    expect(hasAdminAccess("WARGA")).toBe(false);
    expect(hasAdminAccess("PUBLIK")).toBe(false);
  });
});

