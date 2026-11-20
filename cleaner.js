/**
 * StudentLife Survey Result Explorer - Cleaning & Validation Engine
 * Project #92: Survey Result Explorer | Domain: Data & Visualization
 * 
 * Provides:
 * 1. Defensive real-time input sanitization & boundary checks.
 * 2. Automated data cleaning pipeline (deduplication, whitespace trimming, normalization, imputation, anomaly correction).
 * 3. Step-by-step cleaning audit log generation.
 * 4. Frequency distribution & executive summary calculations.
 */

// Helper to escape HTML characters defensively
function sanitizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Defensive Validation Module
 */
const DefensiveValidator = {
  /**
   * Validates a single survey record against domain constraints.
   */
  validate(record, existingRecords = [], isNew = false) {
    const errors = [];
    const warnings = [];
    const sanitized = { ...record };

    // 1. Respondent ID Validation
    if (!record.id || String(record.id).trim() === '') {
      errors.push('Respondent ID is required.');
    } else {
      sanitized.id = String(record.id).trim().toUpperCase();
      if (!/^[A-Z0-9\-_]{3,15}$/i.test(sanitized.id)) {
        errors.push('Respondent ID must be 3-15 alphanumeric characters (e.g. STU-1045).');
      } else if (isNew && existingRecords.some(r => r.id === sanitized.id)) {
        errors.push(`Duplicate ID: Respondent ${sanitized.id} already exists in the dataset.`);
      }
    }

    // 2. Name Sanitization
    sanitized.name = sanitizeText(record.name || 'Anonymous Student');

    // 3. Department Validation
    const rawDept = String(record.department || '').trim();
    const matchedDept = window.SURVEY_SCHEMA.departments.find(
      d => d.toLowerCase() === rawDept.toLowerCase()
    );
    if (!rawDept) {
      errors.push('Department selection is required.');
    } else if (matchedDept) {
      sanitized.department = matchedDept;
    } else {
      errors.push(`Invalid department: "${rawDept}". Must match canonical taxonomy.`);
    }

    // 4. Academic Year Validation
    const rawYear = String(record.year || '').trim();
    const matchedYear = window.SURVEY_SCHEMA.years.find(
      y => y.toLowerCase() === rawYear.toLowerCase()
    );
    if (!rawYear) {
      errors.push('Academic year is required.');
    } else if (matchedYear) {
      sanitized.year = matchedYear;
    } else {
      errors.push(`Invalid academic year: "${rawYear}".`);
    }

    // 5. Daily Study Hours (0 to 18)
    const study = parseFloat(record.studyHours);
    if (isNaN(study)) {
      errors.push('Study hours must be a valid number.');
    } else if (study < 0) {
      errors.push('Study hours cannot be negative.');
    } else if (study > 18) {
      errors.push('Study hours cannot exceed 18 hours per day.');
    } else {
      sanitized.studyHours = Math.round(study * 10) / 10;
      if (sanitized.studyHours > 12) {
        warnings.push(`High study workload: ${sanitized.studyHours} hrs/day reported.`);
      }
    }

    // 6. Daily Sleep Hours (0 to 16)
    const sleep = parseFloat(record.sleepHours);
    if (isNaN(sleep)) {
      errors.push('Sleep hours must be a valid number.');
    } else if (sleep < 0) {
      errors.push('Sleep hours cannot be negative.');
    } else if (sleep > 16) {
      errors.push('Sleep hours cannot exceed 16 hours per day.');
    } else {
      sanitized.sleepHours = Math.round(sleep * 10) / 10;
      if (sanitized.sleepHours < 5) {
        warnings.push(`Critical sleep deprivation: only ${sanitized.sleepHours} hrs/day reported.`);
      }
    }

    // 7. Stress Level (1 to 10)
    const stress = parseInt(record.stressLevel, 10);
    if (isNaN(stress)) {
      errors.push('Stress level must be a number between 1 and 10.');
    } else if (stress < 1 || stress > 10) {
      errors.push('Stress level must be an integer between 1 and 10.');
    } else {
      sanitized.stressLevel = stress;
      if (stress >= 9) {
        warnings.push(`Severe stress alert: Level ${stress}/10.`);
      }
    }

    // 8. Overall Satisfaction (1 to 5)
    const sat = parseInt(record.satisfaction, 10);
    if (isNaN(sat)) {
      errors.push('Satisfaction rating must be an integer between 1 and 5.');
    } else if (sat < 1 || sat > 5) {
      errors.push('Satisfaction rating must be between 1 and 5.');
    } else {
      sanitized.satisfaction = sat;
    }

    // 9. Primary Concern Validation
    const rawConcern = String(record.primaryConcern || '').trim();
    const matchedConcern = window.SURVEY_SCHEMA.concerns.find(
      c => c.toLowerCase() === rawConcern.toLowerCase()
    );
    if (!rawConcern) {
      errors.push('Primary concern category is required.');
    } else if (matchedConcern) {
      sanitized.primaryConcern = matchedConcern;
    } else {
      errors.push(`Invalid concern category: "${rawConcern}".`);
    }

    // 10. Notes / Comments
    sanitized.notes = sanitizeText(record.notes || '');

    // Threshold warning combination check
    if (sanitized.sleepHours < 4.5 && sanitized.stressLevel >= 8) {
      warnings.push('CRITICAL HEALTH ALERT: Severe sleep deprivation (<4.5h) coupled with extreme stress (>=8).');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedRecord: sanitized
    };
  }
};

/**
 * Data Cleaning Engine
 */
const DataCleaner = {
  /**
   * Run the multi-stage cleaning pipeline on a survey dataset.
   */
  cleanDataset(records) {
    const auditLog = [];
    const stats = {
      totalOriginal: records.length,
      totalCleaned: 0,
      duplicatesRemoved: 0,
      whitespaceTrimmed: 0,
      anomaliesFixed: 0,
      missingImputed: 0
    };

    if (!Array.isArray(records) || records.length === 0) {
      return { cleanedRecords: [], auditLog, stats };
    }

    const seenIds = new Set();
    const workingList = [];

    // Compute dataset medians & modes for intelligent imputation
    const validStudy = records.map(r => parseFloat(r.studyHours)).filter(v => !isNaN(v) && v >= 0 && v <= 18);
    const validSleep = records.map(r => parseFloat(r.sleepHours)).filter(v => !isNaN(v) && v >= 0 && v <= 16);
    const validStress = records.map(r => parseInt(r.stressLevel, 10)).filter(v => !isNaN(v) && v >= 1 && v <= 10);
    const validSat = records.map(r => parseInt(r.satisfaction, 10)).filter(v => !isNaN(v) && v >= 1 && v <= 5);

    const median = arr => {
      if (!arr.length) return 5;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const mode = arr => {
      if (!arr.length) return null;
      const counts = {};
      let maxEl = arr[0], maxCount = 1;
      for (const el of arr) {
        if (!el) continue;
        counts[el] = (counts[el] || 0) + 1;
        if (counts[el] > maxCount) {
          maxEl = el;
          maxCount = counts[el];
        }
      }
      return maxEl;
    };

    const medianStudy = Math.round(median(validStudy) * 10) / 10 || 6.0;
    const medianSleep = Math.round(median(validSleep) * 10) / 10 || 7.0;
    const medianStress = Math.round(median(validStress)) || 5;
    const medianSat = Math.round(median(validSat)) || 4;
    const defaultConcern = mode(records.map(r => r.primaryConcern).filter(Boolean)) || 'Course Workload';

    // Step 1 & 2: Deduplication and Sanitization
    for (let i = 0; i < records.length; i++) {
      const orig = records[i];
      const cleaned = { ...orig };
      let modified = false;

      // Extract and clean ID
      const rawId = String(orig.id || `STU-${1000 + i + 1}`).trim().toUpperCase();

      // Deduplication check
      if (seenIds.has(rawId)) {
        stats.duplicatesRemoved++;
        auditLog.push({
          rowId: rawId,
          type: 'DUPLICATE_DROPPED',
          action: 'Dropped duplicate record',
          details: `Respondent ID "${rawId}" was already processed. Dropped row index ${i + 1}.`,
          timestamp: new Date().toLocaleTimeString()
        });
        continue; // Skip duplicate
      }
      seenIds.add(rawId);
      cleaned.id = rawId;

      // Step 3: Whitespace & Casing Normalization
      if (orig.department && typeof orig.department === 'string') {
        const trimmedDept = orig.department.trim();
        if (trimmedDept !== orig.department) {
          stats.whitespaceTrimmed++;
          modified = true;
        }
        // Normalize against schema
        const match = window.SURVEY_SCHEMA.departments.find(
          d => d.toLowerCase() === trimmedDept.toLowerCase()
        );
        cleaned.department = match || trimmedDept;
      } else {
        cleaned.department = 'Computer Science';
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Department',
          details: 'Defaulted to "Computer Science".',
          timestamp: new Date().toLocaleTimeString()
        });
      }

      if (orig.year && typeof orig.year === 'string') {
        const trimmedYear = orig.year.trim();
        const matchYear = window.SURVEY_SCHEMA.years.find(
          y => y.toLowerCase() === trimmedYear.toLowerCase()
        );
        cleaned.year = matchYear || 'Freshman';
      } else {
        cleaned.year = 'Freshman';
      }

      if (orig.primaryConcern && typeof orig.primaryConcern === 'string') {
        const trimmedConcern = orig.primaryConcern.trim();
        if (trimmedConcern !== orig.primaryConcern) {
          stats.whitespaceTrimmed++;
          modified = true;
        }
        const matchConcern = window.SURVEY_SCHEMA.concerns.find(
          c => c.toLowerCase() === trimmedConcern.toLowerCase()
        );
        cleaned.primaryConcern = matchConcern || defaultConcern;
      } else {
        cleaned.primaryConcern = defaultConcern;
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Primary Concern',
          details: `Filled missing concern with dataset mode: "${defaultConcern}".`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Step 4: Numerical Anomaly & Boundary Clamping
      // Study Hours
      let study = parseFloat(orig.studyHours);
      if (isNaN(study)) {
        cleaned.studyHours = medianStudy;
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Study Hours',
          details: `Replaced non-numeric study hours with median: ${medianStudy} hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (study < 0) {
        cleaned.studyHours = 0.0;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CLAMPED',
          action: 'Corrected negative Study Hours',
          details: `Clamped impossible value ${study} hrs to 0.0 hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (study > 18) {
        cleaned.studyHours = 18.0;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CLAMPED',
          action: 'Clamped excessive Study Hours',
          details: `Clamped outlier value ${study} hrs to maximum limit 18.0 hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        cleaned.studyHours = Math.round(study * 10) / 10;
      }

      // Sleep Hours
      let sleep = parseFloat(orig.sleepHours);
      if (isNaN(sleep)) {
        cleaned.sleepHours = medianSleep;
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Sleep Hours',
          details: `Replaced non-numeric sleep hours with median: ${medianSleep} hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (sleep < 0) {
        cleaned.sleepHours = 0.0;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CLAMPED',
          action: 'Corrected negative Sleep Hours',
          details: `Clamped impossible value ${sleep} hrs to 0.0 hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (sleep > 16) {
        cleaned.sleepHours = medianSleep;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CORRECTED',
          action: 'Corrected unrealistic Sleep Hours',
          details: `Clamped unrealistic value ${sleep} hrs to dataset median ${medianSleep} hrs.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        cleaned.sleepHours = Math.round(sleep * 10) / 10;
      }

      // Stress Level (1-10)
      let stress = parseInt(orig.stressLevel, 10);
      if (isNaN(stress)) {
        cleaned.stressLevel = medianStress;
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Stress Level',
          details: `Replaced non-numeric stress level with median: ${medianStress}.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (stress < 1) {
        cleaned.stressLevel = 1;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CLAMPED',
          action: 'Adjusted out-of-range Stress Level',
          details: `Adjusted lower-bound value ${stress} to minimum 1.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (stress > 10) {
        cleaned.stressLevel = 10;
        stats.anomaliesFixed++;
        auditLog.push({
          rowId: rawId,
          type: 'ANOMALY_CLAMPED',
          action: 'Adjusted excessive Stress Level',
          details: `Adjusted upper-bound value ${stress} to maximum 10.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        cleaned.stressLevel = stress;
      }

      // Satisfaction (1-5)
      let sat = parseInt(orig.satisfaction, 10);
      if (isNaN(sat)) {
        cleaned.satisfaction = medianSat;
        stats.missingImputed++;
        auditLog.push({
          rowId: rawId,
          type: 'MISSING_IMPUTED',
          action: 'Imputed missing Satisfaction Rating',
          details: `Filled missing rating with dataset median: ${medianSat}/5.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (sat < 1) {
        cleaned.satisfaction = 1;
        stats.anomaliesFixed++;
      } else if (sat > 5) {
        cleaned.satisfaction = 5;
        stats.anomaliesFixed++;
      } else {
        cleaned.satisfaction = sat;
      }

      // Name & Notes sanitization
      cleaned.name = sanitizeText(orig.name || 'Anonymous Student');
      cleaned.notes = sanitizeText(orig.notes || '');
      cleaned.timestamp = orig.timestamp || new Date().toISOString();
      cleaned.status = 'Clean';

      workingList.push(cleaned);
    }

    stats.totalCleaned = workingList.length;

    return {
      cleanedRecords: workingList,
      auditLog,
      stats
    };
  }
};

/**
 * Analytics & Aggregation Engine
 */
const AnalyticsEngine = {
  /**
   * Calculate frequency distribution for any categorical property.
   */
  calculateFrequencies(records, fieldName) {
    if (!Array.isArray(records) || records.length === 0) return [];
    const counts = {};
    const total = records.length;

    for (const record of records) {
      const val = record[fieldName] || 'Unspecified';
      counts[val] = (counts[val] || 0) + 1;
    }

    let runningCumulative = 0;
    const sorted = Object.keys(counts)
      .map(key => {
        const count = counts[key];
        const percentage = Math.round((count / total) * 1000) / 10;
        return { value: key, count, percentage };
      })
      .sort((a, b) => b.count - a.count);

    return sorted.map(item => {
      runningCumulative += item.count;
      return {
        ...item,
        cumulative: runningCumulative,
        cumulativePercentage: Math.round((runningCumulative / total) * 1000) / 10
      };
    });
  },

  /**
   * Computes comprehensive executive summary metrics.
   */
  calculateExecutiveSummary(records) {
    if (!Array.isArray(records) || records.length === 0) {
      return {
        totalRecords: 0,
        cleanRecords: 0,
        qualityScore: 0,
        avgStudyHours: 0,
        avgSleepHours: 0,
        avgStressLevel: 0,
        avgSatisfaction: 0,
        topConcern: 'None',
        criticalAlertsCount: 0,
        criticalAlerts: [],
        departmentStats: []
      };
    }

    const total = records.length;
    let cleanCount = 0;
    let sumStudy = 0;
    let sumSleep = 0;
    let sumStress = 0;
    let sumSat = 0;
    const criticalAlerts = [];

    records.forEach(r => {
      if (r.status === 'Clean') cleanCount++;
      const study = parseFloat(r.studyHours) || 0;
      const sleep = parseFloat(r.sleepHours) || 0;
      const stress = parseFloat(r.stressLevel) || 0;
      const sat = parseFloat(r.satisfaction) || 0;

      sumStudy += study;
      sumSleep += sleep;
      sumStress += stress;
      sumSat += sat;

      // Threshold Warning Trigger: Extreme stress coupled with sleep deprivation
      if (sleep < 4.5 && stress >= 8) {
        criticalAlerts.push({
          id: r.id,
          name: r.name,
          department: r.department,
          sleepHours: sleep,
          stressLevel: stress,
          primaryConcern: r.primaryConcern,
          reason: 'Severe sleep deprivation (<4.5h) with critical stress (>=8)'
        });
      }
    });

    const concernFreq = this.calculateFrequencies(records, 'primaryConcern');
    const topConcern = concernFreq.length > 0 ? `${concernFreq[0].value} (${concernFreq[0].percentage}%)` : 'None';

    // Department breakdown
    const deptMap = {};
    records.forEach(r => {
      const d = r.department || 'Other';
      if (!deptMap[d]) {
        deptMap[d] = { count: 0, totalStress: 0, totalStudy: 0, totalSleep: 0 };
      }
      deptMap[d].count++;
      deptMap[d].totalStress += parseFloat(r.stressLevel) || 0;
      deptMap[d].totalStudy += parseFloat(r.studyHours) || 0;
      deptMap[d].totalSleep += parseFloat(r.sleepHours) || 0;
    });

    const departmentStats = Object.keys(deptMap).map(dept => {
      const d = deptMap[dept];
      return {
        department: dept,
        count: d.count,
        avgStress: Math.round((d.totalStress / d.count) * 10) / 10,
        avgStudy: Math.round((d.totalStudy / d.count) * 10) / 10,
        avgSleep: Math.round((d.totalSleep / d.count) * 10) / 10
      };
    });

    return {
      totalRecords: total,
      cleanRecords: cleanCount,
      qualityScore: Math.round((cleanCount / total) * 100),
      avgStudyHours: Math.round((sumStudy / total) * 10) / 10,
      avgSleepHours: Math.round((sumSleep / total) * 10) / 10,
      avgStressLevel: Math.round((sumStress / total) * 10) / 10,
      avgSatisfaction: Math.round((sumSat / total) * 10) / 10,
      topConcern,
      criticalAlertsCount: criticalAlerts.length,
      criticalAlerts,
      departmentStats
    };
  }
};

window.DefensiveValidator = DefensiveValidator;
window.DataCleaner = DataCleaner;
window.AnalyticsEngine = AnalyticsEngine;
