export type ParsedPersonName = {
  firstName: string;
  lastName: string;
  middleName?: string;
};

/**
 * Conservative parser for Russian FIO strings.
 * - 2 parts: "Lastname Firstname"
 * - 3 parts: "Lastname Firstname Middlename"
 * - other lengths: stores full name as firstName, leaves other parts empty.
 */
export function parsePersonName(fullName: string): ParsedPersonName {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 2) {
    return {
      lastName: parts[0],
      firstName: parts[1]
    };
  }

  if (parts.length === 3) {
    return {
      lastName: parts[0],
      firstName: parts[1],
      middleName: parts[2]
    };
  }

  return {
    firstName: fullName.trim(),
    lastName: ""
  };
}
