import Tesseract from "tesseract.js";
import crypto from "crypto";
import os from "os";
import User from "../models/user";

// ==========================================
// VERHOEFF ALGORITHM — Aadhaar Checksum
// ==========================================
// The Verhoeff algorithm is used by UIDAI to validate Aadhaar numbers.
// Every valid Aadhaar number passes this checksum test.

const verhoeffMultiplicationTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffPermutationTable: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates an Aadhaar number using the Verhoeff checksum algorithm.
 * Returns true if the number is structurally valid.
 */
export function validateVerhoeff(aadhaarNumber: string): boolean {
  // Must be exactly 12 digits
  const cleaned = aadhaarNumber.replace(/[\s-]/g, "");
  if (!/^\d{12}$/.test(cleaned)) return false;

  // Aadhaar cannot start with 0 or 1
  if (cleaned[0] === "0" || cleaned[0] === "1") return false;

  let checksum = 0;
  const reversedDigits = cleaned.split("").reverse().map(Number);

  for (let i = 0; i < reversedDigits.length; i++) {
    const permIndex = i % 8;
    const permValue = verhoeffPermutationTable[permIndex][reversedDigits[i]];
    checksum = verhoeffMultiplicationTable[checksum][permValue];
  }

  return checksum === 0;
}

// ==========================================
// OCR — Text Extraction from Aadhaar Image
// ==========================================

/**
 * Extract text from an image buffer using Tesseract.js OCR.
 * Configured for English + Hindi (common on Aadhaar cards).
 */
export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imageBuffer, "eng", {
      cachePath: os.tmpdir(), // Use writable /tmp directory for serverless environments like Vercel
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    console.log("OCR Raw Output:", text.substring(0, 200) + "...");
    return text;
  } catch (error: any) {
    console.error("OCR Error:", error.message);
    return "";
  }
}

/**
 * Extract a 12-digit Aadhaar number from OCR text.
 * Handles common OCR misreadings and formatting variations.
 */
export function extractAadhaarNumber(ocrText: string): string | null {
  // Clean the text
  const cleaned = ocrText.replace(/[oOlI]/g, (match) => {
    // Common OCR misreads: O/o → 0, l/I → 1
    if (match === "o" || match === "O") return "0";
    if (match === "l" || match === "I") return "1";
    return match;
  });

  // Pattern 1: XXXX XXXX XXXX (spaced format)
  const spacedPattern = /[2-9]\d{3}\s+\d{4}\s+\d{4}/g;
  const spacedMatch = cleaned.match(spacedPattern);
  if (spacedMatch) {
    return spacedMatch[0].replace(/\s/g, "");
  }

  // Pattern 2: XXXX-XXXX-XXXX (hyphenated format)
  const hyphenPattern = /[2-9]\d{3}-\d{4}-\d{4}/g;
  const hyphenMatch = cleaned.match(hyphenPattern);
  if (hyphenMatch) {
    return hyphenMatch[0].replace(/-/g, "");
  }

  // Pattern 3: Continuous 12 digits
  const continuousPattern = /[2-9]\d{11}/g;
  const continuousMatch = cleaned.match(continuousPattern);
  if (continuousMatch) {
    return continuousMatch[0];
  }

  return null;
}

/**
 * Extract a name from the OCR text of the Aadhaar card.
 * The name typically appears after specific markers on the card.
 */
export function extractName(ocrText: string): string | null {
  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Common patterns on Aadhaar cards
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a name label (next line would be the name)
    if (/^(name|naam)/i.test(line) && i + 1 < lines.length) {
      return lines[i + 1].trim();
    }

    // Check for inline "Name: Rohit Kumar" pattern
    const nameMatch = line.match(/(?:name|naam)\s*[:\-]?\s*(.+)/i);
    if (nameMatch && nameMatch[1].trim().length > 2) {
      return nameMatch[1].trim();
    }
  }

  // Fallback: Look for lines that look like names (alphabetic, 2+ words, 4-50 chars)
  for (const line of lines) {
    const cleaned = line.trim();
    if (
      /^[A-Za-z\s.]+$/.test(cleaned) &&
      cleaned.split(/\s+/).length >= 2 &&
      cleaned.length >= 4 &&
      cleaned.length <= 50 &&
      !/government|india|authority|unique|identification|uidai|male|female|dob|date|birth|address/i.test(cleaned)
    ) {
      return cleaned;
    }
  }

  return null;
}

/**
 * Check if the OCR text contains Aadhaar-specific keywords.
 * This helps confirm the uploaded document is actually an Aadhaar card.
 */
export function checkAadhaarKeywords(ocrText: string): boolean {
  const keywords = [
    "government of india",
    "unique identification",
    "uidai",
    "aadhaar",
    "aadhar",
    "भारत सरकार", // Hindi: Government of India
    "आधार",       // Hindi: Aadhaar
    "enrollment",
    "enrolment",
    "vid",
  ];

  const lowerText = ocrText.toLowerCase();
  let matchCount = 0;

  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      matchCount++;
    }
  }

  // At least 2 keyword matches to confirm it's an Aadhaar
  return matchCount >= 2;
}

/**
 * Fuzzy name matching between OCR-extracted name and profile name.
 * Uses case-insensitive partial matching to handle OCR errors.
 */
export function fuzzyNameMatch(
  ocrName: string | null,
  profileFirstName: string,
  profileLastName: string
): boolean {
  if (!ocrName) return false;

  const ocrLower = ocrName.toLowerCase().trim();
  const firstLower = profileFirstName.toLowerCase().trim();
  const lastLower = profileLastName.toLowerCase().trim();
  const fullName = `${firstLower} ${lastLower}`;

  // Exact full name match
  if (ocrLower === fullName) return true;

  // OCR name contains both first and last name
  if (ocrLower.includes(firstLower) && ocrLower.includes(lastLower))
    return true;

  // At least first name or last name matches (OCR often misses parts)
  if (
    firstLower.length >= 3 &&
    (ocrLower.includes(firstLower) || firstLower.includes(ocrLower))
  )
    return true;

  if (
    lastLower.length >= 3 &&
    (ocrLower.includes(lastLower) || lastLower.includes(ocrLower))
  )
    return true;

  // Levenshtein-like: check if 70% of characters match
  const matchChars = fullName
    .split("")
    .filter((c) => ocrLower.includes(c)).length;
  const similarity = matchChars / Math.max(fullName.length, 1);

  return similarity >= 0.7;
}

/**
 * Generate a SHA-256 hash of an image buffer for duplicate detection.
 */
export function generateImageHash(imageBuffer: Buffer): string {
  return crypto.createHash("sha256").update(imageBuffer).digest("hex");
}

/**
 * Hash an Aadhaar number for secure storage and duplicate detection.
 * We never store the raw number — only the hash and masked version.
 */
export function hashAadhaarNumber(aadhaarNumber: string): string {
  const cleaned = aadhaarNumber.replace(/[\s-]/g, "");
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

/**
 * Mask an Aadhaar number: 1234 5678 9012 → XXXX-XXXX-9012
 */
export function maskAadhaarNumber(aadhaarNumber: string): string {
  const cleaned = aadhaarNumber.replace(/[\s-]/g, "");
  if (cleaned.length !== 12) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${cleaned.slice(8)}`;
}

/**
 * Check if another user has already used this Aadhaar number.
 */
export async function checkDuplicateAadhaar(
  aadhaarNumber: string,
  currentUserId: string
): Promise<boolean> {
  const masked = maskAadhaarNumber(aadhaarNumber);

  // Check if any other user has the same masked Aadhaar
  const existingUser = await User.findOne({
    "verification.aadhaarNumber": masked,
    "verification.status": { $in: ["VERIFIED", "SUBMITTED"] },
    _id: { $ne: currentUserId },
  });

  // Returns true if NO duplicate found (i.e., check passed)
  return !existingUser;
}

/**
 * Check basic image quality metrics.
 */
export function checkImageQuality(imageBuffer: Buffer): boolean {
  // Minimum 10KB (too small = likely blank/corrupted)
  if (imageBuffer.length < 10 * 1024) return false;

  // Maximum 5MB
  if (imageBuffer.length > 5 * 1024 * 1024) return false;

  // Check for valid image headers (JPEG, PNG)
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

  const isJpeg = imageBuffer.subarray(0, 3).equals(jpegHeader);
  const isPng = imageBuffer.subarray(0, 4).equals(pngHeader);

  return isJpeg || isPng;
}

// ==========================================
// MAIN ORCHESTRATOR
// ==========================================

export interface VerificationResult {
  confidenceScore: number;
  status: "SUBMITTED";
  checks: {
    verhoeffValid: boolean;
    ocrNumberMatch: boolean;
    ocrNameMatch: boolean;
    ocrKeywordsFound: boolean;
    duplicateCheck: boolean;
    imageQuality: boolean;
  };
  ocrExtractedName?: string;
  ocrExtractedNumber?: string;
}

/**
 * Run the full Aadhaar verification pipeline.
 *
 * @param aadhaarNumber - The 12-digit Aadhaar number entered by the user
 * @param aadhaarImageBuffer - The image buffer of the Aadhaar card
 * @param profileFirstName - User's first name from their profile
 * @param profileLastName - User's last name from their profile
 * @param userId - Current user's ID (for duplicate check)
 */
export async function runVerification(
  aadhaarNumber: string,
  aadhaarImageBuffer: Buffer,
  profileFirstName: string,
  profileLastName: string,
  userId: string
): Promise<VerificationResult> {
  console.log("🔍 Starting Aadhaar Verification Pipeline...");

  // Step 1: Verhoeff checksum
  const verhoeffValid = validateVerhoeff(aadhaarNumber);
  console.log(`  ✓ Verhoeff Checksum: ${verhoeffValid ? "PASS" : "FAIL"}`);

  // Step 2: Image quality check
  const imageQuality = checkImageQuality(aadhaarImageBuffer);
  console.log(`  ✓ Image Quality: ${imageQuality ? "PASS" : "FAIL"}`);

  // Step 3: OCR extraction
  let ocrText = "";
  let ocrExtractedNumber: string | null = null;
  let ocrExtractedName: string | null = null;
  let ocrNumberMatch = false;
  let ocrNameMatch = false;
  let ocrKeywordsFound = false;

  if (imageQuality) {
    ocrText = await extractTextFromImage(aadhaarImageBuffer);

    // Step 4: Extract Aadhaar number from OCR
    ocrExtractedNumber = extractAadhaarNumber(ocrText);
    console.log(`  ✓ OCR Number Extracted: ${ocrExtractedNumber || "NOT FOUND"}`);

    // Step 5: Compare OCR number with entered number
    if (ocrExtractedNumber) {
      const cleanedInput = aadhaarNumber.replace(/[\s-]/g, "");
      const cleanedOcr = ocrExtractedNumber.replace(/[\s-]/g, "");
      ocrNumberMatch = cleanedInput === cleanedOcr;
    }
    console.log(`  ✓ OCR Number Match: ${ocrNumberMatch ? "PASS" : "FAIL"}`);

    // Step 6: Extract and compare name
    ocrExtractedName = extractName(ocrText);
    console.log(`  ✓ OCR Name Extracted: ${ocrExtractedName || "NOT FOUND"}`);
    ocrNameMatch = fuzzyNameMatch(ocrExtractedName, profileFirstName, profileLastName);
    console.log(`  ✓ Name Match: ${ocrNameMatch ? "PASS" : "FAIL"}`);

    // Step 7: Check Aadhaar keywords
    ocrKeywordsFound = checkAadhaarKeywords(ocrText);
    console.log(`  ✓ Aadhaar Keywords: ${ocrKeywordsFound ? "FOUND" : "NOT FOUND"}`);
  }

  // Step 8: Duplicate check
  const duplicateCheck = await checkDuplicateAadhaar(aadhaarNumber, userId);
  console.log(`  ✓ Duplicate Check: ${duplicateCheck ? "PASS (No duplicate)" : "FAIL (Duplicate found)"}`);

  // Calculate confidence score
  const score =
    (verhoeffValid ? 25 : 0) +
    (ocrNumberMatch ? 25 : 0) +
    (ocrNameMatch ? 20 : 0) +
    (ocrKeywordsFound ? 15 : 0) +
    (duplicateCheck ? 10 : 0) +
    (imageQuality ? 5 : 0);

  console.log(`\n📊 Confidence Score: ${score}/100`);

  // All submissions go to admin review — AI score is advisory only
  // Admin sees full details and makes the final decision
  const status = "SUBMITTED" as const;
  console.log(`⚡ SUBMITTED FOR ADMIN REVIEW (Score: ${score}/100)`);

  return {
    confidenceScore: score,
    status,
    checks: {
      verhoeffValid,
      ocrNumberMatch,
      ocrNameMatch,
      ocrKeywordsFound,
      duplicateCheck,
      imageQuality,
    },
    ocrExtractedName: ocrExtractedName || undefined,
    ocrExtractedNumber: ocrExtractedNumber || undefined,
  };
}
