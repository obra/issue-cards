// ABOUTME: Section management utilities for markdown files
// ABOUTME: Handles section detection, extraction, and content manipulation

/**
 * Extract all sections from markdown content
 * 
 * @param {string} content - Markdown content
 * @returns {Array<Object>} List of sections with name, content, startLine, and endLine
 */
function getSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a section heading
    if (line.trim().startsWith('## ')) {
      // If we were already in a section, push it to the array
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start a new section
      currentSection = {
        name: line.substring(line.indexOf('##') + 2).trim(),
        content: '',
        startLine: i,
        endLine: i
      };
    } 
    // Add content to current section if we're in one
    else if (currentSection) {
      // If this is the first content line, it's part of the section
      if (currentSection.content === '') {
        currentSection.content = line.trim();
      }
      // Otherwise, add to the content with newlines
      else if (line.trim() !== '') {
        currentSection.content += '\n' + line.trim();
      }
      
      // Update the end line if we added content
      if (line.trim() !== '') {
        currentSection.endLine = i;
      }
      
      // Check if we've reached the next section heading or end of file
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      if (nextLine.trim().startsWith('## ') || i === lines.length - 1) {
        // End of section, if we have a section, add it and we're at the end of file
        if (currentSection && i === lines.length - 1) {
          sections.push(currentSection);
          currentSection = null;
        }
      }
    }
  }
  
  // Add the last section if we haven't already
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Normalize a section name to standard format
 * 
 * @param {string} sectionName - Section name to normalize
 * @returns {string} Normalized section name
 */
function normalizeSectionName(sectionName) {
  const sectionMap = {
    // Map different forms to standard section names
    'problem': 'Problem to be solved',
    'problemtobesolved': 'Problem to be solved',
    'problem-to-be-solved': 'Problem to be solved',
    'problem_to_be_solved': 'Problem to be solved',
    
    'approach': 'Planned approach',
    'plannedapproach': 'Planned approach',
    'planned-approach': 'Planned approach',
    'planned_approach': 'Planned approach',
    
    'failed': 'Failed approaches',
    'failedapproaches': 'Failed approaches',
    'failed-approaches': 'Failed approaches',
    'failed_approaches': 'Failed approaches',
    
    'questions': 'Questions to resolve',
    'questionstosolve': 'Questions to resolve',
    'questionstoasolve': 'Questions to resolve',
    'questions-to-resolve': 'Questions to resolve',
    'questions_to_resolve': 'Questions to resolve',
    'questionstoresolve': 'Questions to resolve',
    
    'tasks': 'Tasks',
    
    'instructions': 'Instructions',
    
    'next': 'Next steps',
    'nextsteps': 'Next steps',
    'next-steps': 'Next steps',
    'next_steps': 'Next steps'
  };
  
  // Convert to lowercase and remove spaces for matching
  const normalizedInput = sectionName.toLowerCase().replace(/[\s-_]/g, '');
  
  return sectionMap[normalizedInput] || sectionName;
}

/**
 * Find a section by name in markdown content
 * 
 * @param {string} content - Markdown content
 * @param {string} sectionName - Name of section to find
 * @returns {Object|null} Section object or null if not found
 */
function findSectionByName(content, sectionName) {
  // Normalize the section name
  const normalizedName = normalizeSectionName(sectionName);
  
  // Get all sections and find the one with matching name
  const sections = getSections(content);
  
  return sections.find(section => 
    section.name === normalizedName ||
    normalizeSectionName(section.name) === normalizedName
  ) || null;
}

/**
 * Get content from a specific section
 * 
 * @param {string} content - Markdown content
 * @param {string} sectionName - Name of section
 * @returns {string|null} Section content or null if not found
 */
function getSectionContent(content, sectionName) {
  const section = findSectionByName(content, sectionName);
  return section ? section.content : null;
}

/**
 * Format a note based on section type
 * 
 * @param {string} text - Note text
 * @param {string} sectionName - Section name
 * @param {string} format - Optional formatting type (question, failure, task)
 * @param {Object} options - Additional formatting options
 * @returns {string} Formatted note text
 */
function formatNoteForSection(text, sectionName, format, options = {}) {
  const normalizedSection = normalizeSectionName(sectionName);
  
  switch (format) {
    case 'question':
      // Format as a task item for questions
      return `- [ ] ${text.endsWith('?') ? text : text + '?'}`;
      
    case 'failure':
      // Format as a failed approach
      return `### Failed attempt\n\n${text}\n\n**Reason:** ${options.reason || 'Not specified'}`;
      
    case 'task':
      // Format as a task item
      return `- [ ] ${text}`;
      
    default:
      // Default formatting (plain text)
      return text;
  }
}

/**
 * Add content to a section in markdown content
 * 
 * @param {string} content - Markdown content
 * @param {string} sectionName - Name of section
 * @param {string} newContent - Content to add
 * @param {string} format - Optional formatting type
 * @param {Object} options - Additional formatting options
 * @returns {string} Updated markdown content
 */
function addContentToSection(content, sectionName, newContent, format, options = {}) {
  const section = findSectionByName(content, sectionName);
  
  if (!section) {
    throw new Error(`Section "${sectionName}" not found in issue`);
  }
  
  // Format the content appropriately
  let formattedContent = formatNoteForSection(newContent, sectionName, format, options);
  
  // For list item sections, make sure we format correctly
  const normalizedSection = normalizeSectionName(sectionName);
  const isListSection = normalizedSection === 'Questions to resolve' || normalizedSection === 'Tasks';
  
  // If it's a list section and the format isn't already handled, make it a task item
  if (isListSection && format !== 'question' && format !== 'task' && !formattedContent.startsWith('- ')) {
    formattedContent = `- [ ] ${formattedContent}`;
  }
  
  // Get the lines of the document
  const lines = content.split('\n');
  
  // Find the section in the content
  let inSection = false;
  let sectionStart = -1;
  let sectionEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('## ') && lines[i].includes(section.name)) {
      inSection = true;
      sectionStart = i;
      continue;
    }
    
    if (inSection && (i === lines.length - 1 || (lines[i+1] && lines[i+1].trim().startsWith('## ')))) {
      sectionEnd = i;
      break;
    }
  }
  
  if (sectionStart === -1) {
    throw new Error(`Section "${sectionName}" not found in issue`);
  }
  
  // Determine replacement content
  let updatedSectionContent;
  
  if (section.content === '') {
    // Empty section - add content directly after the heading
    updatedSectionContent = `${lines[sectionStart]}\n${formattedContent}`;
    
    // Replace the section
    lines.splice(sectionStart, 1, updatedSectionContent);
  } else {
    // Add to existing content
    if (isListSection) {
      // For lists, add as a new list item
      lines.splice(sectionEnd + 1, 0, formattedContent);
    } else {
      // For prose sections, add with a blank line
      lines.splice(sectionEnd + 1, 0, '', formattedContent);
    }
  }
  
  return lines.join('\n');
}

module.exports = {
  getSections,
  findSectionByName,
  normalizeSectionName,
  getSectionContent,
  formatNoteForSection,
  addContentToSection
};