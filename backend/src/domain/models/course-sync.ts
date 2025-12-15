/**
 * Domain models for the Salesforce → Supabase course synchronization feature.
 *
 * IMPORTANT: These are initial skeleton interfaces. They purposely contain only
 * a minimal set of fields plus TODO notes describing future enrichments.
 *
 * Naming: English is used (Course, CourseOffering) as requested to keep clear
 * distinction with existing Spanish domain models. We can later add adapters
 * if we need bilingual mapping for front-end consumption.
 */

/**
 * Represents a Course entity aggregated from Salesforce data.
 *
 * TODO: Confirm canonical unique identifiers (Salesforce Id vs internal UUID).
 * TODO: Add rich metadata (category, tags, SEO info, duration, etc.).
 * TODO: Evaluate normalization vs denormalization strategy for offerings.
 */
export interface Course {
  /** Internal unique identifier (Supabase). Added post-upsert. */
  id?: string;
  /** Original Salesforce course (Program) identifier. */
  salesforceId?: string;
  /** Public slug used in URLs. TODO: Define slug generation rules. */
  slug: string;
  /** Human readable title. */
  title: string;
  /** Academic / commercial year. TODO: Validate numeric vs string format. */
  year?: number;
  /** Whether the course is currently active / marketable. */
  active?: boolean;
  /** Related offerings (sessions / editions). */
  offerings?: CourseOffering[];
  /** TODO: Add fields (category, modality summary, etc.). */
}

/**
 * Represents an individual offering / edition of a course (e.g., a 2025 Spring cohort).
 *
 * TODO: Clarify if offerings are separate Salesforce objects or child records.
 * TODO: Add schedule granularity (weekly pattern, timezone).
 * TODO: Clarify price localization (taxes, multi-currency support).
 */
export interface CourseOffering {
  id?: string; // Supabase PK
  salesforceId?: string; // Salesforce child record id
  courseId?: string; // Back-reference (Supabase) - may be filled after persistence
  /** ISO date string for the start of the offering. TODO: Confirm source format. */
  startDate?: string;
  /** ISO date string for the end of the offering. */
  endDate?: string;
  /** Delivery modality. TODO: Map Salesforce picklist values. */
  modality?: "ONLINE" | "PRESENCIAL" | "HIBRIDO";
  /** Physical or virtual location descriptor. */
  location?: string;
  /** Base price (without taxes). */
  price?: number;
  /** Currency code (ISO 4217). TODO: Confirm if multi-currency needed. */
  currency?: string;
  /** TODO: Add capacity, enrollment counts, status, language, instructors, etc. */
}

/**
 * Transformation result type (future expansion point).
 * Keeping explicit to allow additional metadata later (e.g., warnings, stats).
 * TODO: Refine this structure when implementing transform logic.
 */
export interface CourseSyncTransformationResult {
  courses: Course[];
  // TODO: Add diagnostics: { warnings: string[]; errors: string[] }
}
