/**
 * parser.js – Information Parsing Module
 * Form AutoFill
 *
 * Extracts candidate information from raw text and maps it to structured form fields.
 */

/**
 * Main parser function.
 * @param {string} text - Extracted document text
 * @returns {Object} Parsed entities map
 */
function parseDocumentText(text) {
  if (!text || typeof text !== 'string') return {};

  const result = {};

  trySet(result, 'email',       extractEmail(text));
  trySet(result, 'phone',       extractPhone(text));
  trySet(result, 'fullName',    extractName(text, result));
  trySet(result, 'dob',         extractDOB(text));
  trySet(result, 'gender',      extractGender(text));
  trySet(result, 'nationality', extractNationality(text));
  trySet(result, 'linkedin',    extractLinkedIn(text));
  trySet(result, 'github',      extractGitHub(text));
  trySet(result, 'website',     extractWebsite(text, result));
  trySet(result, 'summary',     extractSummary(text));
  trySet(result, 'skills',      extractSkills(text));
  trySet(result, 'city',        extractCity(text));
  trySet(result, 'state',       extractState(text));
  trySet(result, 'zipcode',     extractZipCode(text));
  trySet(result, 'country',     extractCountry(text));
  trySet(result, 'street',      extractStreet(text));
  result.education   = extractEducation(text);
  result.experience  = extractExperience(text);

  return result;
}

function trySet(obj, key, val) {
  if (val && val.value && String(val.value).trim().length > 0) {
    obj[key] = val;
  }
}

// ═══════════════════════════════════════════════════════════════
//  FIELD EXTRACTORS
// ═══════════════════════════════════════════════════════════════

/** Email */
function extractEmail(text) {
  const m = text.match(/[\w.+\-]+@[\w\-]+\.[\w.\-]{2,}/);
  if (m) return { value: m[0].trim(), confidence: 0.99 };
  return null;
}

/** Phone */
function extractPhone(text) {
  const patterns = [
    /(?:Phone|Tel|Mobile|Cell|Contact|Ph)[:\s#.]*([+\d][\d\s\-().]{7,18}\d)/i,
    /\+\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
    /\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/,
    /\d{5}[\s\-]\d{5}/,
    /\d{10}/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const num = (m[1] || m[0]).replace(/\s+/g, ' ').trim();
      if (num.replace(/\D/g, '').length >= 7) {
        return { value: num, confidence: 0.93 };
      }
    }
  }
  return null;
}

/** Full Name (Strict Candidate Full Name Extractor) */
function extractName(text, already) {
  // Labeled pattern search (e.g. "Full Name: John Doe" or "Candidate Name: Jane Smith")
  const labeled = text.match(/(?:Name|Full\s*Name|Candidate\s*Name|Applicant\s*Name|Applicant)[:\s]+([A-Z][a-zA-Z'\-.]+(?:\s+[A-Z][a-zA-Z'\-.]+){1,4})/i);
  if (labeled && labeled[1].trim().split(/\s+/).length >= 2) {
    return { value: labeled[1].trim(), confidence: 0.95 };
  }

  // Non-name section headers, job titles, or keywords to filter out
  const invalidKeywords = /^(resume|curriculum|vitae|cv|portfolio|profile|summary|objective|experience|education|skills|projects|contact|address|phone|email|page|university|college|school|institute|bachelor|master|diploma|certificate|section|reference|references|engineer|developer|manager|specialist|analyst|associate|intern|lead|architect|designer|director|consultant|executive|officer|head|vp|ceo|cto)$/i;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const emailVal = already.email ? already.email.value : null;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];

    if (emailVal && line.includes(emailVal)) continue;
    if (/[@\/:0-9()\-+]/.test(line) && line.length < 5) continue;
    if (/\d{4,}/.test(line)) continue;
    if (/^(https?|www\.|linkedin|github|mailto|tel)/i.test(line)) continue;
    if (/resume|curriculum|vitae|cv|portfolio|profile|page\s*\d+/i.test(line)) continue;

    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;

    if (words.some(w => invalidKeywords.test(w))) continue;

    // Title Case (e.g. John Doe, Jane M. Smith)
    const nameMatch = line.match(/^([A-Z][a-zA-Z'\-.]+(?:\s+[A-Z][a-zA-Z'\-.]+){1,4})$/);
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (candidate.length >= 3 && candidate.length <= 40) {
        return { value: candidate, confidence: 0.88 };
      }
    }

    // ALL-CAPS Name (e.g. JOHN DOE)
    const capsMatch = line.match(/^([A-Z]{2,20}(?:\s+[A-Z]{2,20}){1,4})$/);
    if (capsMatch) {
      const candidate = capsMatch[1].trim();
      if (!invalidKeywords.test(candidate)) {
        const formatted = candidate.toLowerCase()
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (formatted.length >= 3 && formatted.length <= 40) {
          return { value: formatted, confidence: 0.80 };
        }
      }
    }
  }

  return null;
}

/** Date of Birth */
function extractDOB(text) {
  const patterns = [
    /(?:DOB|Date\s+of\s+Birth|Born|Birth\s*Date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:DOB|Date\s+of\s+Birth|Born|Birth\s*Date)[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(?:DOB|Date\s+of\s+Birth|Born)[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return { value: m[1].trim(), confidence: 0.9 };
  }
  return null;
}

/** Gender */
function extractGender(text) {
  const m = text.match(/(?:Gender|Sex)[:\s]+(Male|Female|Non[\s\-]binary|M|F|Other)/i);
  if (m) {
    let val = m[1].trim();
    if (/^m$/i.test(val)) val = 'Male';
    if (/^f$/i.test(val)) val = 'Female';
    return { value: val.charAt(0).toUpperCase() + val.slice(1), confidence: 0.88 };
  }
  return null;
}

/** Nationality */
function extractNationality(text) {
  const m = text.match(/(?:Nationality|Citizenship|Citizen)[:\s]+([A-Za-z\s]{3,30}?)(?:\n|,|\.)/i);
  if (m) return { value: m[1].trim(), confidence: 0.8 };
  return null;
}

/** LinkedIn */
function extractLinkedIn(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([\w\-%.]+)\/?/i);
  if (m) {
    return { value: 'https://linkedin.com/in/' + m[1].replace(/\/$/, ''), confidence: 0.97 };
  }
  return null;
}

/** GitHub */
function extractGitHub(text) {
  const m = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([\w\-]+)\/?/i);
  if (m) {
    return { value: 'https://github.com/' + m[1].replace(/\/$/, ''), confidence: 0.97 };
  }
  return null;
}

/** Website */
function extractWebsite(text, already) {
  const urlRegex = /https?:\/\/[\w\-.]+(?:\.[\w\-]+)+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/gi;
  let m;
  while ((m = urlRegex.exec(text)) !== null) {
    const url = m[0].replace(/[.,)>\]]+$/, '');
    if (already.linkedin && url.includes('linkedin.com')) continue;
    if (already.github && url.includes('github.com')) continue;
    if (url.includes('google.com') || url.includes('facebook.com')) continue;
    return { value: url, confidence: 0.75 };
  }
  return null;
}

/** Summary */
function extractSummary(text) {
  const m = text.match(/(?:^|\n)(?:PROFESSIONAL\s+SUMMARY|CAREER\s+OBJECTIVE|OBJECTIVE|SUMMARY|PROFILE|ABOUT\s+ME|ABOUT)[:\s]*\n+([\s\S]{40,600}?)(?:\n{2,}|(?=\n[A-Z]{3,}))/i);
  if (m) {
    const summary = m[1].replace(/\s+/g, ' ').trim();
    if (summary.length >= 30) return { value: summary.substring(0, 800), confidence: 0.82 };
  }
  return null;
}

/** Skills */
function extractSkills(text) {
  const sectionMatch = text.match(
    /(?:^|\n)(?:SKILLS?|TECHNICAL\s+SKILLS?|KEY\s+SKILLS?|CORE\s+COMPETENCIES?|TECHNOLOGIES?|TOOLS?\s*&?\s*TECHNOLOGIES?)[:\s]*\n([\s\S]{10,600}?)(?:\n{2,}|\n[A-Z]{3,})/i
  );

  let skillText = sectionMatch ? sectionMatch[1] : '';
  if (!skillText) {
    const inline = text.match(/(?:Skills?|Proficient in|Technologies?)[:\s]+([^\n]{10,300})/i);
    if (inline) skillText = inline[1];
  }

  if (!skillText) return null;

  const rawSkills = skillText
    .split(/[,\n•·▪▸►\-|\/\\]+/)
    .map(s => s.replace(/^\s*[-•·*►▸▪]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 40)
    .filter(s => !/^\d+$/.test(s))
    .filter(s => !/^(and|or|the|in|of|with|for|a|an)$/i.test(s));

  const unique = [...new Set(rawSkills)];
  if (unique.length > 0) {
    return { value: unique.slice(0, 25).join(', '), confidence: 0.85 };
  }
  return null;
}

/** Street */
function extractStreet(text) {
  const m = text.match(/\d+[A-Za-z]?\s+[\w\s]{3,40}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Blvd|Boulevard|Way|Court|Ct|Place|Pl|Circle|Cir)\.?(?:\s*,\s*(?:Apt|Suite|Unit|Flat|#)\s*[\w\d-]+)?/i);
  if (m) return { value: m[0].trim(), confidence: 0.78 };
  return null;
}

/** City */
function extractCity(text) {
  const m = text.match(/(?:City|Location)[:\s]+([A-Za-z\s]{2,30})(?:\n|,|\.)/i);
  if (m) return { value: m[1].trim(), confidence: 0.8 };
  const addr = text.match(/([A-Z][a-zA-Z\s]{2,20}),\s*([A-Z]{2})\s+\d{5}/);
  if (addr) return { value: addr[1].trim(), confidence: 0.72 };
  return null;
}

/** State */
function extractState(text) {
  const m1 = text.match(/[A-Z][a-zA-Z\s]{2,20},\s*([A-Z]{2})\s+\d{5}/);
  if (m1) return { value: m1[1].trim(), confidence: 0.78 };
  const m2 = text.match(/(?:State|Province)[:\s]+([A-Za-z\s]{2,40})(?:\n|,|\.)/i);
  if (m2) return { value: m2[1].trim(), confidence: 0.75 };
  return null;
}

/** ZIP Code */
function extractZipCode(text) {
  const m = text.match(/\b(\d{5,6})(?:\s*-\s*\d{4})?\b/);
  if (m && (m[1].length === 5 || m[1].length === 6)) {
    return { value: m[1], confidence: 0.7 };
  }
  return null;
}

/** Country */
function extractCountry(text) {
  const countries = ['India', 'United States', 'USA', 'United Kingdom', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Netherlands'];
  const m = text.match(/(?:Country|Nation)[:\s]+([A-Za-z\s]{2,30})(?:\n|,|\.)/i);
  if (m) return { value: m[1].trim(), confidence: 0.82 };
  for (const c of countries) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) return { value: c, confidence: 0.65 };
  }
  return null;
}

/** Education */
function extractEducation(text) {
  const entries = [];
  const sec = text.match(/(?:^|\n)(?:EDUCATION|ACADEMIC\s+BACKGROUND|QUALIFICATIONS?)[:\s]*\n([\s\S]{10,1200}?)(?:\n{2,}(?:[A-Z]{3,}|\n)|$)/i);
  const expText = sec ? sec[1] : text;

  const degrees = [
    /(Bachelor['\s]s?|B\.?Tech\.?|B\.?E\.?|B\.?Sc\.?|B\.?Com\.?|B\.?A\.?|BBA|BCA)(?:\s+(?:of|in)\s+)?([A-Za-z\s&,]{2,50})?/gi,
    /(Master['\s]s?|M\.?Tech\.?|M\.?E\.?|M\.?Sc\.?|MBA|MCA)(?:\s+(?:of|in)\s+)?([A-Za-z\s&,]{2,50})?/gi,
    /(Ph\.?D\.?|Doctorate)(?:\s+(?:of|in)\s+)?([A-Za-z\s&,]{2,50})?/gi,
  ];

  const blocks = expText.split(/\n{2,}/);
  for (const block of blocks) {
    if (!block.trim()) continue;
    let degree = '', field = '';
    for (const pat of degrees) {
      pat.lastIndex = 0;
      const m = pat.exec(block);
      if (m) {
        degree = m[1] ? m[1].trim() : '';
        field = m[2] ? m[2].trim().replace(/[,\s]+$/, '') : '';
        break;
      }
    }
    if (degree) {
      const instMatch = block.match(/([A-Z][a-zA-Z\s&.'-]{5,60}(?:University|Institute|College|School|IIT|NIT|BITS|VIT|MIT))/);
      const inst = instMatch ? instMatch[1].trim() : '';
      const yrMatch = block.match(/\b(20\d{2}|19\d{2})\b/);
      const yr = yrMatch ? yrMatch[1] : '';
      entries.push({ degree, institution: inst, field, year: yr });
    }
    if (entries.length >= 4) break;
  }
  return entries;
}

/** Experience */
function extractExperience(text) {
  const entries = [];
  const sec = text.match(/(?:^|\n)(?:(?:WORK|PROFESSIONAL)\s+)?(?:EXPERIENCE|HISTORY|EMPLOYMENT)[:\s]*\n([\s\S]{10,1500}?)(?:\n{2,}(?:[A-Z]{3,}\n)|$)/i);
  const expText = sec ? sec[1] : text;

  const titles = /(Software\s+Engineer|Senior\s+Engineer|Developer|Analyst|Manager|Intern|Lead|Architect|Designer|Consultant|Specialist|Associate)/gi;
  const blocks = expText.split(/\n{2,}/);

  for (const block of blocks) {
    if (!block.trim()) continue;
    titles.lastIndex = 0;
    const m = titles.exec(block);
    if (m) {
      const jobTitle = m[1].trim();
      const compMatch = block.match(/(?:at|@|for|Company[:\s]+)\s*([A-Z][a-zA-Z\s&.,'-]{3,40})/);
      const company = compMatch ? compMatch[1].trim() : '';
      const dateMatch = block.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to\s]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|\d{4})/i);
      const duration = dateMatch ? `${dateMatch[1]} – ${dateMatch[2]}` : '';
      entries.push({ jobTitle, company, duration, description: block.split('\n').slice(0,2).join(' ').substring(0, 150) });
    }
    if (entries.length >= 5) break;
  }
  return entries;
}
