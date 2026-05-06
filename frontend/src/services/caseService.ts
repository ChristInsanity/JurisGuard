import type { CriminalCaseRecord } from "../types";
import { mockCases } from "../features/criminalCases/mockData";

export async function getCases(): Promise<CriminalCaseRecord[]> {
  return Promise.resolve(mockCases);
}
