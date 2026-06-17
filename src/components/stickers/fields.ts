// Field rectangles in PDF user-space points (origin bottom-left)
// extracted directly from the source PDF AcroForm widgets.
// The HTML sticker renders at these same numeric values in CSS pixels,
// overlaid on the matching PDF background image, then snapshotted.

export type Rect = [number, number, number, number];

// Envelope layout: landscape, page size 780 x 540 pt
export const ENVELOPE_W = 780;
export const ENVELOPE_H = 540;

// Archive layout: portrait, page size 540 x 780 pt
export const ARCHIVE_W = 540;
export const ARCHIVE_H = 780;

export const ENVELOPE_FIELDS: Record<string, Rect> = {
  room: [623, 326, 743, 377],
  courseCode: [439, 376, 514, 403],
  sectionNumber: [280, 373, 321, 404],
  courseName: [279, 333, 511, 361],
  teacher: [281, 277, 673, 307],
  coordinator: [281, 237, 675, 267],
  date: [514, 194, 687, 225],
  day: [281, 195, 437, 225],
  period: [281, 152, 431, 182],
  location: [513, 153, 690, 184],
  monitor1: [580, 89, 733, 117],
  monitor2: [431, 89, 567, 117],
  monitor3: [286, 89, 422, 117],
  department: [38, 331, 232, 380],
  papersBefore: [144, 100, 185, 129],
  papersAfter: [49, 100, 88, 129],
  semester: [600, 432, 682, 466],
  examSession: [439, 432, 518, 466],
  academicYear: [273, 432, 387, 466],
};

export const ARCHIVE_FIELDS: Record<string, Rect> = {
  department: [28, 661, 464, 681],
  semester: [415, 705, 467, 724],
  examSession: [303, 702, 355, 727],
  academicYear: [172, 703, 268, 727],
  courseCodeBottom: [362, 10, 510, 42],
  teacher: [31, 564, 466, 583],
  sectionNumber: [30, 629, 89, 648],
  semesterCode: [429, 595, 514, 627],
  courseCode: [171, 630, 256, 647],
  courseName: [30, 599, 252, 617],
  departmentBottom: [29, 76, 467, 94],
  room: [329, 595, 416, 628],
  coordinator: [30, 534, 467, 554],
  date: [349, 504, 450, 523],
  day: [164, 505, 268, 524],
  papers: [34, 446, 147, 505],
  location: [348, 475, 478, 495],
  period: [163, 474, 291, 494],
  envelopeLabel: [164, 445, 469, 464],
  sectionNumberBottom: [205, 12, 343, 44],
  envelopeLabelBottom: [27, 43, 133, 64],
  semesterCodeBottom: [25, 14, 113, 31],
};

export interface StickerSettings {
  collegeName: string;
  controlNumber: string;
  semester: string;
  academicYear: string;
  examSession?: string;
}
