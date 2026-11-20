/**
 * StudentLife Survey Result Explorer - Data Module
 * Project #92: Survey Result Explorer | Domain: Data & Visualization
 * 
 * Provides schema constraints, initial seed dataset (clean + boundary + dirty records),
 * and local storage persistence helpers.
 */

const SURVEY_SCHEMA = {
  departments: [
    'Computer Science',
    'Engineering',
    'Business',
    'Health Sciences',
    'Arts & Humanities',
    'Natural Sciences'
  ],
  years: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'],
  concerns: [
    'Course Workload',
    'Exam Pressure',
    'Mental Health & Well-being',
    'Facilities & Housing',
    'Career Guidance',
    'Social Life'
  ],
  limits: {
    studyHours: { min: 0, max: 18, defaultVal: 5 },
    sleepHours: { min: 0, max: 16, defaultVal: 7 },
    stressLevel: { min: 1, max: 10, defaultVal: 5 },
    satisfaction: { min: 1, max: 5, defaultVal: 3 }
  }
};

// 40 realistic student survey records including normal, boundary, and intentional dirty cases
const DEFAULT_SURVEY_DATA = [
  {
    id: 'STU-1001',
    name: 'Aarav Sharma',
    department: 'Computer Science',
    year: 'Junior',
    studyHours: 7.5,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 4,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-10T09:30:00Z',
    status: 'Clean',
    notes: 'Heavy programming assignments during midterms.'
  },
  {
    id: 'STU-1002',
    name: 'Beatriz Santos',
    department: 'Engineering',
    year: 'Senior',
    studyHours: 8.0,
    sleepHours: 5.5,
    stressLevel: 8,
    satisfaction: 3,
    primaryConcern: 'Exam Pressure',
    timestamp: '2026-11-10T10:15:00Z',
    status: 'Clean',
    notes: 'Capstone design project deadlines overlapping.'
  },
  {
    id: 'STU-1003',
    name: 'Chen Wei',
    department: 'Business',
    year: 'Sophomore',
    studyHours: 4.5,
    sleepHours: 7.5,
    stressLevel: 4,
    satisfaction: 5,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-10T11:00:00Z',
    status: 'Clean',
    notes: 'Looking for summer finance internships.'
  },
  {
    id: 'STU-1004',
    name: 'Divya Nair',
    department: 'Health Sciences',
    year: 'Freshman',
    studyHours: 6.0,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Mental Health & Well-being',
    timestamp: '2026-11-10T11:45:00Z',
    status: 'Clean',
    notes: 'Transition to university dorm life.'
  },
  {
    id: 'STU-1005',
    name: 'Ethan Miller',
    department: 'Arts & Humanities',
    year: 'Junior',
    studyHours: 5.0,
    sleepHours: 8.0,
    stressLevel: 3,
    satisfaction: 5,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-10T13:20:00Z',
    status: 'Clean',
    notes: 'Library quiet study zones are helpful.'
  },
  {
    id: 'STU-1006',
    name: 'Fatima Al-Mansoor',
    department: 'Natural Sciences',
    year: 'Senior',
    studyHours: 9.0,
    sleepHours: 5.0,
    stressLevel: 8,
    satisfaction: 3,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-10T14:10:00Z',
    status: 'Clean',
    notes: 'Organic chemistry lab reports take massive time.'
  },
  {
    id: 'STU-1007',
    name: 'Gabriel Rossi',
    department: 'Computer Science',
    year: 'Freshman',
    studyHours: 5.5,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-11T09:00:00Z',
    status: 'Clean',
    notes: 'Active in coding club and robotics.'
  },
  // Intentional dirty case #1: Untrimmed whitespace and lowercase department
  {
    id: 'STU-1008',
    name: 'Hanna Lindqvist',
    department: '  engineering  ',
    year: 'Junior',
    studyHours: 6.5,
    sleepHours: 6.5,
    stressLevel: 6,
    satisfaction: 4,
    primaryConcern: '  Exam Pressure  ',
    timestamp: '2026-11-11T09:40:00Z',
    status: 'Raw',
    notes: 'Raw input with untrimmed whitespace.'
  },
  // Intentional dirty case #2: Duplicate Respondent ID (same STU-1008 ID)
  {
    id: 'STU-1008',
    name: 'Hanna Lindqvist (Duplicate Submission)',
    department: 'Engineering',
    year: 'Junior',
    studyHours: 6.5,
    sleepHours: 6.5,
    stressLevel: 6,
    satisfaction: 4,
    primaryConcern: 'Exam Pressure',
    timestamp: '2026-11-11T09:45:00Z',
    status: 'Raw',
    notes: 'Submitted form twice accidentally.'
  },
  {
    id: 'STU-1009',
    name: 'Ian O\'Connor',
    department: 'Business',
    year: 'Senior',
    studyHours: 5.0,
    sleepHours: 7.0,
    stressLevel: 6,
    satisfaction: 4,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-11T10:30:00Z',
    status: 'Clean',
    notes: 'Participating in case competitions.'
  },
  {
    id: 'STU-1010',
    name: 'Jasmine Kaur',
    department: 'Health Sciences',
    year: 'Sophomore',
    studyHours: 7.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 3,
    primaryConcern: 'Mental Health & Well-being',
    timestamp: '2026-11-11T11:15:00Z',
    status: 'Clean',
    notes: 'Clinical shifts leave little recovery time.'
  },
  // Intentional dirty case #3: Out-of-bounds sleep & study hours anomaly
  {
    id: 'STU-1011',
    name: 'Klaus Fischer',
    department: 'Computer Science',
    year: 'Graduate',
    studyHours: -3.0, // Anomaly: Negative study hours!
    sleepHours: 25.0, // Anomaly: Impossible >24h sleep!
    stressLevel: 14,  // Anomaly: Exceeds 1-10 scale!
    satisfaction: 3,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-11T12:00:00Z',
    status: 'Raw',
    notes: 'Corrupted telemetry entries in survey kiosk.'
  },
  {
    id: 'STU-1012',
    name: 'Leila Touré',
    department: 'Arts & Humanities',
    year: 'Senior',
    studyHours: 4.0,
    sleepHours: 8.5,
    stressLevel: 2,
    satisfaction: 5,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-11T13:40:00Z',
    status: 'Clean',
    notes: 'Thesis draft completed early.'
  },
  {
    id: 'STU-1013',
    name: 'Marcus Vance',
    department: 'Natural Sciences',
    year: 'Freshman',
    studyHours: 6.0,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-11T14:20:00Z',
    status: 'Clean',
    notes: 'Dorm Wi-Fi has occasional drops.'
  },
  // Intentional dirty case #4: Missing primary concern and satisfaction
  {
    id: 'STU-1014',
    name: 'Noor Al-Hassan',
    department: 'Business',
    year: 'Junior',
    studyHours: 5.5,
    sleepHours: 6.5,
    stressLevel: 6,
    satisfaction: null, // Missing value
    primaryConcern: '',  // Missing value
    timestamp: '2026-11-12T09:10:00Z',
    status: 'Raw',
    notes: 'User submitted before completing last section.'
  },
  {
    id: 'STU-1015',
    name: 'Oliver Kim',
    department: 'Computer Science',
    year: 'Senior',
    studyHours: 10.0,
    sleepHours: 4.5,
    stressLevel: 9,
    satisfaction: 2,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-12T10:00:00Z',
    status: 'Clean',
    notes: 'Extreme sleep deficit due to multiple programming projects.'
  },
  {
    id: 'STU-1016',
    name: 'Priya Patel',
    department: 'Engineering',
    year: 'Freshman',
    studyHours: 6.0,
    sleepHours: 7.5,
    stressLevel: 4,
    satisfaction: 4,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-12T11:05:00Z',
    status: 'Clean',
    notes: 'Adjusting well to campus life.'
  },
  {
    id: 'STU-1017',
    name: 'Quinn Taylor',
    department: 'Arts & Humanities',
    year: 'Sophomore',
    studyHours: 4.5,
    sleepHours: 7.0,
    stressLevel: 4,
    satisfaction: 4,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-12T11:50:00Z',
    status: 'Clean',
    notes: 'Art studio hours should be extended on weekends.'
  },
  {
    id: 'STU-1018',
    name: 'Rahul Verma',
    department: 'Health Sciences',
    year: 'Junior',
    studyHours: 7.5,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 3,
    primaryConcern: 'Mental Health & Well-being',
    timestamp: '2026-11-12T13:10:00Z',
    status: 'Clean',
    notes: 'Would like more mental health drop-in clinics.'
  },
  {
    id: 'STU-1019',
    name: 'Sofia Martinez',
    department: 'Natural Sciences',
    year: 'Junior',
    studyHours: 8.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 4,
    primaryConcern: 'Exam Pressure',
    timestamp: '2026-11-12T14:00:00Z',
    status: 'Clean',
    notes: 'Genetics midterm preparation.'
  },
  // Boundary case: Zero study hours & high satisfaction
  {
    id: 'STU-1020',
    name: 'Tariq Johnson',
    department: 'Business',
    year: 'Freshman',
    studyHours: 1.0,
    sleepHours: 9.0,
    stressLevel: 2,
    satisfaction: 5,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-13T09:30:00Z',
    status: 'Clean',
    notes: 'Syllabus week, minimal study load.'
  },
  {
    id: 'STU-1021',
    name: 'Uma Das',
    department: 'Computer Science',
    year: 'Sophomore',
    studyHours: 7.0,
    sleepHours: 6.5,
    stressLevel: 6,
    satisfaction: 4,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-13T10:15:00Z',
    status: 'Clean',
    notes: 'Data structures course is demanding but interesting.'
  },
  {
    id: 'STU-1022',
    name: 'Victor Hugo Ramos',
    department: 'Engineering',
    year: 'Graduate',
    studyHours: 9.5,
    sleepHours: 5.5,
    stressLevel: 8,
    satisfaction: 3,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-13T11:00:00Z',
    status: 'Clean',
    notes: 'Publishing research papers alongside graduate coursework.'
  },
  {
    id: 'STU-1023',
    name: 'Wendy Zhang',
    department: 'Natural Sciences',
    year: 'Sophomore',
    studyHours: 6.5,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-13T11:45:00Z',
    status: 'Clean',
    notes: 'Campus bus schedule needs higher frequency.'
  },
  {
    id: 'STU-1024',
    name: 'Xavier Dubois',
    department: 'Arts & Humanities',
    year: 'Freshman',
    studyHours: 3.5,
    sleepHours: 8.0,
    stressLevel: 3,
    satisfaction: 4,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-13T13:30:00Z',
    status: 'Clean',
    notes: 'Enjoying literature seminars.'
  },
  // Intentional dirty case #5: Mixed casing and spaces in category
  {
    id: 'STU-1025',
    name: 'Yara El-Sayed',
    department: 'Health Sciences',
    year: 'Senior',
    studyHours: 8.5,
    sleepHours: 5.0,
    stressLevel: 9,
    satisfaction: 2,
    primaryConcern: '  MENTAL HEALTH & WELL-BEING ',
    timestamp: '2026-11-13T14:15:00Z',
    status: 'Raw',
    notes: 'Burnout symptoms before licensure exams.'
  },
  {
    id: 'STU-1026',
    name: 'Zane Ibrahim',
    department: 'Computer Science',
    year: 'Junior',
    studyHours: 8.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 3,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-14T09:00:00Z',
    status: 'Clean',
    notes: 'Technical interview practice takes extra time.'
  },
  {
    id: 'STU-1027',
    name: 'Ananya Roy',
    department: 'Business',
    year: 'Graduate',
    studyHours: 7.0,
    sleepHours: 6.5,
    stressLevel: 6,
    satisfaction: 4,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-14T10:00:00Z',
    status: 'Clean',
    notes: 'MBA consulting project engagements.'
  },
  {
    id: 'STU-1028',
    name: 'Brendan Kelly',
    department: 'Engineering',
    year: 'Sophomore',
    studyHours: 7.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 3,
    primaryConcern: 'Exam Pressure',
    timestamp: '2026-11-14T11:20:00Z',
    status: 'Clean',
    notes: 'Thermodynamics syllabus is very dense.'
  },
  {
    id: 'STU-1029',
    name: 'Chloe Tremblay',
    department: 'Natural Sciences',
    year: 'Senior',
    studyHours: 8.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 4,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-14T13:00:00Z',
    status: 'Clean',
    notes: 'Applying for graduate research fellowships.'
  },
  {
    id: 'STU-1030',
    name: 'Daisuke Sato',
    department: 'Computer Science',
    year: 'Freshman',
    studyHours: 6.0,
    sleepHours: 7.5,
    stressLevel: 4,
    satisfaction: 5,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-14T14:10:00Z',
    status: 'Clean',
    notes: 'Great campus mentor support system.'
  },
  {
    id: 'STU-1031',
    name: 'Elena Rostova',
    department: 'Arts & Humanities',
    year: 'Graduate',
    studyHours: 7.5,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-15T09:30:00Z',
    status: 'Clean',
    notes: 'Graduate student housing stipend discussion.'
  },
  {
    id: 'STU-1032',
    name: 'Farhan Siddiqui',
    department: 'Health Sciences',
    year: 'Freshman',
    studyHours: 5.5,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-15T10:45:00Z',
    status: 'Clean',
    notes: 'Anatomy flashcard review groups formed.'
  },
  {
    id: 'STU-1033',
    name: 'Grace Hopper-Smith',
    department: 'Computer Science',
    year: 'Senior',
    studyHours: 9.0,
    sleepHours: 5.0,
    stressLevel: 8,
    satisfaction: 3,
    primaryConcern: 'Exam Pressure',
    timestamp: '2026-11-15T11:30:00Z',
    status: 'Clean',
    notes: 'Balancing full course load and part-time tech work.'
  },
  {
    id: 'STU-1034',
    name: 'Hector Morales',
    department: 'Business',
    year: 'Sophomore',
    studyHours: 5.0,
    sleepHours: 7.5,
    stressLevel: 4,
    satisfaction: 4,
    primaryConcern: 'Social Life',
    timestamp: '2026-11-15T13:15:00Z',
    status: 'Clean',
    notes: 'Member of marketing society.'
  },
  {
    id: 'STU-1035',
    name: 'Ingrid Nygård',
    department: 'Engineering',
    year: 'Junior',
    studyHours: 7.5,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 3,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-15T14:40:00Z',
    status: 'Clean',
    notes: 'Solid mechanics assignments require MATLAB help.'
  },
  // Extreme threshold condition: High stress + severe sleep deprivation
  {
    id: 'STU-1036',
    name: 'Joel MacIntyre',
    department: 'Computer Science',
    year: 'Junior',
    studyHours: 11.5,
    sleepHours: 3.5, // Alert trigger: < 4 hours sleep
    stressLevel: 10, // Alert trigger: stress = 10
    satisfaction: 1,
    primaryConcern: 'Mental Health & Well-being',
    timestamp: '2026-11-16T09:20:00Z',
    status: 'Clean',
    notes: 'Urgent academic counseling recommended.'
  },
  {
    id: 'STU-1037',
    name: 'Kavita Chawla',
    department: 'Natural Sciences',
    year: 'Freshman',
    studyHours: 5.0,
    sleepHours: 7.5,
    stressLevel: 4,
    satisfaction: 4,
    primaryConcern: 'Facilities & Housing',
    timestamp: '2026-11-16T10:30:00Z',
    status: 'Clean',
    notes: 'Biology labs are well-equipped.'
  },
  {
    id: 'STU-1038',
    name: 'Liam Gallagher',
    department: 'Arts & Humanities',
    year: 'Junior',
    studyHours: 4.5,
    sleepHours: 8.0,
    stressLevel: 3,
    satisfaction: 5,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-16T11:45:00Z',
    status: 'Clean',
    notes: 'Internship with local museum confirmed.'
  },
  {
    id: 'STU-1039',
    name: 'Mei-Ling Zhou',
    department: 'Health Sciences',
    year: 'Graduate',
    studyHours: 8.0,
    sleepHours: 6.0,
    stressLevel: 7,
    satisfaction: 4,
    primaryConcern: 'Course Workload',
    timestamp: '2026-11-16T13:20:00Z',
    status: 'Clean',
    notes: 'Master in Public Health thesis defense coming up.'
  },
  {
    id: 'STU-1040',
    name: 'Noah Bennett',
    department: 'Business',
    year: 'Senior',
    studyHours: 6.0,
    sleepHours: 7.0,
    stressLevel: 5,
    satisfaction: 4,
    primaryConcern: 'Career Guidance',
    timestamp: '2026-11-16T14:50:00Z',
    status: 'Clean',
    notes: 'Full-time offer received, feeling relieved.'
  }
];

const LOCAL_STORAGE_KEY = 'studentlife_survey_records_v1';

/**
 * Storage Controller: Safely reads and writes data with error handling
 */
const DataStorage = {
  /**
   * Load current dataset from localStorage or fallback to default sample data
   */
  loadData() {
    try {
      const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!serialized) {
        this.saveData(DEFAULT_SURVEY_DATA);
        return JSON.parse(JSON.stringify(DEFAULT_SURVEY_DATA));
      }
      const parsed = JSON.parse(serialized);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return JSON.parse(JSON.stringify(DEFAULT_SURVEY_DATA));
    } catch (e) {
      console.warn('Could not read from localStorage, using default data:', e);
      return JSON.parse(JSON.stringify(DEFAULT_SURVEY_DATA));
    }
  },

  /**
   * Save dataset to localStorage
   */
  saveData(data) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  },

  /**
   * Reset data back to default initial seed
   */
  resetToDefault() {
    this.saveData(DEFAULT_SURVEY_DATA);
    return JSON.parse(JSON.stringify(DEFAULT_SURVEY_DATA));
  },

  /**
   * Clear all records
   */
  clearAll() {
    this.saveData([]);
    return [];
  }
};

// Export to window for global access
window.SURVEY_SCHEMA = SURVEY_SCHEMA;
window.DEFAULT_SURVEY_DATA = DEFAULT_SURVEY_DATA;
window.DataStorage = DataStorage;
