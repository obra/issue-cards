# SQLite Migration Implementation Plan

## Overview

This plan outlines the steps to migrate Issue Cards from a file-based system to a SQLite database using Prisma, with a focus on creating a clean model layer architecture.

## Revised Key Features & Improvements

1. **Structured Data Model**: Replace ad-hoc parsing of markdown files with a proper database schema
2. **Template Handling**: Use JSON files in config directory instead of database blobs for templates
3. **Export Functionality**: Add ability to export issues back to markdown format
4. **Robust Error Handling**: Standardized approach for database operations
5. **Enhanced Relations**: Support for issue relationships and task comments

## Phase 1: Project Setup (Week 1)

### 1.1. Dependencies Installation

```bash
# Install Prisma dependencies
npm install @prisma/client
npm install -D prisma

# Other dependencies
npm install better-sqlite3   # For direct SQLite access if needed
npm install dotenv           # For environment configuration
npm install fs-extra         # For enhanced file operations
```

### 1.2. Prisma Configuration

1. Initialize Prisma:
   ```bash
   npx prisma init
   ```

2. Configure `.env` file:
   ```
   DATABASE_URL="file:./.issues/issues.db"
   ```

3. Create Prisma schema in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   // Schema definitions (Issue, Section, Task, Tag, etc.)
   ```

### 1.3. Directory Structure

Create or update the following directories:
```
src/
├── models/               # Model classes
├── utils/                # Utility functions
├── commands/             # Command handlers
└── services/             # Optional business logic layer
```

### 1.4. Setup Database Utility

Create `src/utils/database.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { getIssueDirectoryPath } = require('./directory');

// Initialize Prisma client (singleton pattern)
let prisma;

function getDatabasePath() {
  const issuesDir = getIssueDirectoryPath();
  return process.env.DATABASE_URL || 
    `file:${path.join(issuesDir, 'issues.db')}`;
}

function getPrismaClient() {
  if (!prisma) {
    // Set database URL if not already in environment
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = getDatabasePath();
    }
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });
  }
  
  return prisma;
}

module.exports = {
  getPrismaClient,
};
```

## Phase 2: Database Schema Definition (Week 1)

### 2.1. Define Prisma Schema

Update `prisma/schema.prisma` with the complete schema:

```prisma
model Issue {
  id          Int       @id @default(autoincrement())
  issueNumber String    @unique // '0001', '0002', etc.
  title       String
  templateName String   // Template name (references external JSON file)
  status      String    // 'open' or 'closed'
  createdAt   DateTime  @default(now())
  closedAt    DateTime?
  isCurrent   Boolean   @default(false)
  
  // Relations
  sections    Section[]
  tasks       Task[]
  metadata    IssueMetadata[]
  relationsAsSource  IssueRelation[] @relation("SourceIssue")
  relationsAsTarget  IssueRelation[] @relation("TargetIssue")

  @@index([status]) // Index for faster filtering by status
}

model Section {
  id        Int     @id @default(autoincrement())
  name      String  // 'Problem to be solved', 'Planned approach', etc.
  content   String?
  sequence  Int     // For ordering sections
  
  // Relation to Issue
  issue     Issue   @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId   Int
  
  @@unique([issueId, name])
}

model Task {
  id          Int       @id @default(autoincrement())
  description String
  completed   Boolean   @default(false)
  sequence    Int       // For ordering tasks
  completedAt DateTime?
  completedBy String?
  
  // Relation to Issue
  issue       Issue     @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId     Int
  
  // Relations
  tags        Tag[]
  comments    Comment[]

  @@index([completed]) // Index for faster filtering of completed tasks
}

model Tag {
  id       Int     @id @default(autoincrement())
  name     String  // Tag name without prefix
  prefix   String  // '#' or '+'
  
  // Relation to Task
  task     Task    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId   Int
  
  // Relations
  parameters TagParameter[]
}

model TagParameter {
  id      Int    @id @default(autoincrement())
  key     String
  value   String
  
  // Relation to Tag
  tag     Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId   Int
  
  @@unique([tagId, key])
}

// Note: Template model removed - templates now stored as JSON files

model IssueRelation {
  id           Int    @id @default(autoincrement())
  relationType String // 'blocks', 'depends-on', 'related-to', etc.
  
  // Source issue
  sourceIssue  Issue  @relation("SourceIssue", fields: [sourceIssueId], references: [id], onDelete: Cascade)
  sourceIssueId Int
  
  // Target issue
  targetIssue  Issue  @relation("TargetIssue", fields: [targetIssueId], references: [id], onDelete: Cascade)
  targetIssueId Int
  
  @@unique([sourceIssueId, targetIssueId, relationType])
}

model IssueMetadata {
  id      Int    @id @default(autoincrement())
  key     String
  value   String
  
  // Relation to Issue
  issue   Issue  @relation(fields: [issueId], references: [id], onDelete: Cascade)
  issueId Int
  
  @@unique([issueId, key])
}

model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  createdAt DateTime @default(now())
  user      String?
  
  // Relation to Task
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    Int
}
```

### 2.2. Generate Prisma Client

```bash
npx prisma generate
```

### 2.3. Create Migrations

```bash
npx prisma migrate dev --name init
```

## Phase 3: Model Layer Implementation (Week 2)

### 3.1. BaseModel Implementation

Create `src/models/BaseModel.js`:
```javascript
const { getPrismaClient } = require('../utils/database');

class BaseModel {
  constructor() {
    this.prisma = getPrismaClient();
  }
  
  // Common utility methods
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }
}

module.exports = BaseModel;
```

### 3.2. Implementation of Entity Models

Create all model files with their respective methods:

1. `src/models/IssueModel.js`
2. `src/models/TaskModel.js`
3. `src/models/SectionModel.js`
4. `src/models/TagModel.js`
5. `src/utils/TemplateManager.js` (Uses JSON files instead of database)

Each model should properly handle:
- CRUD operations
- Relationship management
- Business logic specific to the entity
- Standardized error handling with custom error classes

#### Template Manager Implementation

The Template Manager will handle JSON-based templates:

```javascript
// src/utils/TemplateManager.js
const fs = require('fs-extra');
const path = require('path');
const { getIssueDirectoryPath } = require('./directory');

class TemplateManager {
  constructor() {
    this.templateDir = path.join(getIssueDirectoryPath(), 'templates');
    this.issueTemplateDir = path.join(this.templateDir, 'issue');
    this.tagTemplateDir = path.join(this.templateDir, 'tag');
  }
  
  /**
   * Initialize template directories
   */
  async initialize() {
    await fs.ensureDir(this.issueTemplateDir);
    await fs.ensureDir(this.tagTemplateDir);
    await this._createDefaultTemplates();
  }
  
  /**
   * Get a template by type and name
   * @param {string} type - Template type ('issue' or 'tag')
   * @param {string} name - Template name
   * @returns {Promise<Object>} Template data
   */
  async getTemplate(type, name) {
    const dir = type === 'issue' ? this.issueTemplateDir : this.tagTemplateDir;
    const filePath = path.join(dir, `${name}.json`);
    
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      throw new Error(`Template not found: ${type}/${name}`);
    }
  }
  
  /**
   * List all templates of a specific type
   * @param {string} type - Template type ('issue' or 'tag')
   * @returns {Promise<Array<string>>} List of template names
   */
  async listTemplates(type) {
    const dir = type === 'issue' ? this.issueTemplateDir : this.tagTemplateDir;
    
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  // Additional methods for template management
}

module.exports = new TemplateManager();
```

### 3.3. Model Testing

Create tests for each model to verify:
- Entity creation
- Relationship management
- Data validation
- Error cases

## Phase 4: Command Updates (Week 3)

### 4.1. Update Key Commands

Update the following commands to use the new model layer:

1. `init.js` - Initialize database and template structure
2. `create.js` - Create new issues
3. `current.js` - Show current task and context
4. `list.js` - List issues
5. `show.js` - Show issue details
6. `set-current.js` - Set the current issue
7. `complete-task.js` - Mark tasks as complete
8. `add-task.js` - Add tasks to issues

### 4.2. Update Auxiliary Commands

Update remaining commands:
1. `add-note.js` - Add notes to issue sections
2. `add-question.js` - Add questions to issues
3. `log-failure.js` - Log failed approaches
4. `templates.js` - Manage templates

### 4.3. Command Testing

Test each command for:
- Correct model interactions
- Error handling
- Output formatting
- User experience consistency

## Phase 5: Feature Enhancements (Week 4)

### 5.1. Issue Relations

Implement issue relation features:
1. Add commands to create/manage relations
2. Update show command to display relations
3. Add filtering by relation type

### 5.2. Task Comments

Implement task commenting:
1. Add command to add comments to tasks
2. Update current/show commands to display comments

### 5.3. Custom Metadata

Implement custom metadata:
1. Add commands to set/get metadata
2. Support for filtering by metadata

### 5.4. Export Functionality

Implement the export feature to maintain data portability:

```javascript
// src/commands/export.js
const { Command } = require('commander');
const IssueModel = require('../models/IssueModel');
const ExportService = require('../services/ExportService');
const fs = require('fs-extra');
const path = require('path');
const outputManager = require('../utils/outputManager');

/**
 * Export issues to markdown files
 */
async function exportAction(options) {
  try {
    const targetDir = options.dir || './exported-issues';
    const issueIds = options.issues ? options.issues.split(',') : [];
    
    // Create export directory if it doesn't exist
    await fs.ensureDir(targetDir);
    
    // Get issues to export (all or specific ones)
    const issues = issueIds.length > 0
      ? await Promise.all(issueIds.map(id => IssueModel.getByNumber(id)))
      : await IssueModel.getAll();
    
    if (issues.length === 0) {
      outputManager.info('No issues to export');
      return;
    }
    
    // Use the export service to generate markdown files
    const exportService = new ExportService();
    const results = await exportService.exportToMarkdown(issues, targetDir);
    
    outputManager.success(`Exported ${results.length} issues to ${targetDir}`);
    results.forEach(result => {
      outputManager.info(`- ${result.issueNumber}: ${result.filePath}`);
    });
  } catch (error) {
    outputManager.error(`Export failed: ${error.message}`);
  }
}

function createCommand() {
  return new Command('export')
    .description('Export issues to markdown files')
    .option('-d, --dir <directory>', 'Directory to export to')
    .option('-i, --issues <list>', 'Comma-separated list of issue numbers to export')
    .action(exportAction);
}

module.exports = { createCommand };
```

The actual export service will handle converting database records back to markdown:

```javascript
// src/services/ExportService.js
const fs = require('fs-extra');
const path = require('path');

class ExportService {
  /**
   * Export issues to markdown format
   * @param {Array<Object>} issues - Issues to export
   * @param {string} targetDir - Directory to save exported files
   * @returns {Promise<Array<Object>>} Export results
   */
  async exportToMarkdown(issues, targetDir) {
    const results = [];
    
    for (const issue of issues) {
      try {
        // Generate markdown content from issue data
        const markdown = this._generateMarkdown(issue);
        
        // Create file path
        const filePath = path.join(
          targetDir, 
          `issue-${issue.issueNumber}.md`
        );
        
        // Write to file
        await fs.writeFile(filePath, markdown, 'utf8');
        
        // Add to results
        results.push({
          issueNumber: issue.issueNumber,
          filePath
        });
      } catch (error) {
        console.error(`Failed to export issue ${issue.issueNumber}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * Generate markdown content from issue data
   * @param {Object} issue - Issue data
   * @returns {string} Markdown content
   */
  _generateMarkdown(issue) {
    // Start with title
    let content = `# Issue ${issue.issueNumber}: ${issue.title}\n\n`;
    
    // Add each section
    const sortedSections = [...issue.sections].sort((a, b) => a.sequence - b.sequence);
    
    for (const section of sortedSections) {
      if (section.content) {
        content += `## ${section.name}\n${section.content}\n\n`;
      } else {
        content += `## ${section.name}\n\n`;
      }
    }
    
    // Add tasks section if not already included
    if (!issue.sections.some(s => s.name === 'Tasks')) {
      content += '## Tasks\n';
      const sortedTasks = [...issue.tasks].sort((a, b) => a.sequence - b.sequence);
      
      for (const task of sortedTasks) {
        const status = task.completed ? '[x]' : '[ ]';
        
        // Include tags in description if any
        let taskText = task.description;
        const tags = task.tags.map(tag => `${tag.prefix}${tag.name}`).join(' ');
        
        if (tags) {
          taskText += ` ${tags}`;
        }
        
        content += `- ${status} ${taskText}\n`;
      }
      
      content += '\n';
    }
    
    return content;
  }
}

module.exports = ExportService;
```

## Phase 6: Testing and Documentation (Week 5)

### 6.1. Integration Testing

1. Create end-to-end tests for key workflows
2. Test database migrations and schema updates
3. Verify data integrity across operations

### 6.2. Documentation

1. Update README with new database information
2. Document model layer architecture
3. Create documentation for new features
4. Update command help text

### 6.3. Performance Testing

1. Test with large numbers of issues (100+)
2. Profile query performance
3. Optimize slow operations

## Phase 7: Finalization (Week 6)

### 7.1. Final Code Review

1. Ensure consistent code style and patterns
2. Review error handling across all components
3. Check for performance bottlenecks

### 7.2. Pre-release Testing

1. Full workflow testing
2. Verify all commands work as expected
3. Test edge cases and error handling

### 7.3. Release Preparation

1. Update version number
2. Prepare release notes
3. Create distribution package

## Detailed Implementation Tasks

### Week 1: Setup and Schema

#### Day 1-2: Project Setup
- [ ] Install dependencies
- [ ] Configure Prisma
- [ ] Set up directory structure
- [ ] Implement database utility

#### Day 3-5: Schema Definition
- [ ] Define Prisma schema models
- [ ] Configure relationships
- [ ] Generate Prisma client
- [ ] Create database migrations

### Week 2: Model Layer

#### Day 1: Base Model and Error Handling
- [ ] Implement BaseModel
- [ ] Set up transaction handling
- [ ] Create custom error classes
- [ ] Implement standardized error handling

#### Day 2-3: Core Models
- [ ] Implement IssueModel
- [ ] Implement TaskModel 
- [ ] Implement SectionModel

#### Day 4-5: Supporting Utilities
- [ ] Implement TagModel
- [ ] Implement TemplateManager using JSON files
- [ ] Implement ExportService for data extraction
- [ ] Write comprehensive tests for models

### Week 3: Command Updates

#### Day 1-2: Core Commands
- [ ] Update init command
- [ ] Update create command
- [ ] Update current command

#### Day 3-4: Issue Management
- [ ] Update list command
- [ ] Update show command
- [ ] Update set-current command

#### Day 5: Task Management
- [ ] Update complete-task command
- [ ] Update add-task command
- [ ] Update auxiliary commands

### Week 4: Feature Enhancements

#### Day 1-2: Issue Relations
- [ ] Implement relation model methods
- [ ] Add relation commands
- [ ] Update issue display

#### Day 3-4: Task Comments
- [ ] Implement comment model methods
- [ ] Add comment commands
- [ ] Update task display

#### Day 5: Custom Metadata and Export
- [ ] Implement metadata model methods
- [ ] Add metadata commands
- [ ] Implement export command
- [ ] Add markdown generation for issue export

### Week 5: Testing and Documentation

#### Day 1-2: Integration Testing
- [ ] Create integration test suite
- [ ] Test database migrations
- [ ] Verify data integrity

#### Day 3-4: Documentation
- [ ] Update README
- [ ] Document model layer
- [ ] Update command help text

#### Day 5: Performance Testing
- [ ] Test with large datasets
- [ ] Profile query performance
- [ ] Optimize slow operations

### Week 6: Finalization

#### Day 1-2: Code Review
- [ ] Ensure consistent code style
- [ ] Review error handling
- [ ] Check for performance issues

#### Day 3-4: Pre-release Testing
- [ ] Test full workflows
- [ ] Verify all commands
- [ ] Test edge cases

#### Day 5: Release
- [ ] Update version number
- [ ] Prepare release notes
- [ ] Create distribution package

## Key Technical Decisions

1. **SQLite + Prisma**: Provides structured data access with minimal configuration
2. **Model Layer**: Abstracts database operations and enforces business rules
3. **Transaction Support**: Ensures data integrity across related operations
4. **Rich Relationships**: Models complex relationships between entities
5. **JSON-based Templates**: Keeps templates editable by hand in config directory
6. **Error Handling Strategy**: Standardized approach for robust applications

### Error Handling Strategy

To ensure robust error handling throughout the application, we'll implement a layered approach:

```javascript
// src/utils/errors.js
class BaseError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.displayMessage = options.displayMessage || message;
    this.details = options.details || {};
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      displayMessage: this.displayMessage,
      details: this.details
    };
  }
}

class DatabaseError extends BaseError {
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'DATABASE_ERROR',
      displayMessage: options.displayMessage || 'A database error occurred',
      details: options.details
    });
    
    this.query = options.query;
    this.params = options.params;
  }
}

class ValidationError extends BaseError {
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'VALIDATION_ERROR',
      displayMessage: options.displayMessage || 'Validation failed',
      details: options.details
    });
  }
}

class NotFoundError extends BaseError {
  constructor(resource, id, options = {}) {
    super(`${resource} not found: ${id}`, {
      code: options.code || 'NOT_FOUND',
      displayMessage: options.displayMessage || `${resource} not found`,
      details: { resource, id, ...options.details }
    });
  }
}

// Error handler for model/database operations
function handleDatabaseError(error, operation, entity) {
  // Handle specific Prisma error codes
  if (error.code === 'P2002') {
    return new ValidationError(`Unique constraint violated for ${entity}`, {
      code: 'UNIQUE_VIOLATION',
      displayMessage: `A ${entity} with that identifier already exists`,
      details: { fields: error.meta?.target }
    });
  }
  
  if (error.code === 'P2025') {
    return new NotFoundError(entity, 'unknown', {
      displayMessage: `The requested ${entity} could not be found`
    });
  }
  
  // Generic database error
  return new DatabaseError(`Failed to ${operation} ${entity}: ${error.message}`, {
    displayMessage: `Failed to ${operation} ${entity}`,
    details: { originalError: error.message }
  });
}

module.exports = {
  BaseError,
  DatabaseError,
  ValidationError,
  NotFoundError,
  handleDatabaseError
};
```

#### Using the Error Classes in Models

```javascript
// Example usage in a model
const { handleDatabaseError, ValidationError } = require('../utils/errors');

class IssueModel extends BaseModel {
  async getByNumber(issueNumber) {
    try {
      if (!issueNumber) {
        throw new ValidationError('Issue number is required');
      }
      
      const issue = await this.prisma.issue.findUnique({
        where: { issueNumber },
        include: { /* relationships */ }
      });
      
      if (!issue) {
        throw new NotFoundError('Issue', issueNumber);
      }
      
      return issue;
    } catch (error) {
      if (error instanceof BaseError) {
        throw error; // Pass through our custom errors
      }
      throw handleDatabaseError(error, 'find', 'issue');
    }
  }
}

## Migration Strategy

Since this is a pre-release product without existing users, we'll implement a clean cutover to the new database system, but ensure we maintain export functionality for data portability:

1. New codebase starts with SQLite from the beginning
2. No automatic conversion of existing file-based issues for backward compatibility
3. Export command provides a way to extract data back to markdown format
4. JSON-based templates maintain the ability for users to edit templates by hand
5. Include documentation that explains the migration to the new system

## Success Metrics

1. **Code Quality**: Simpler, more maintainable codebase
2. **Performance**: Faster operations, especially for large issue sets
3. **Extensibility**: Ability to add new features more easily
4. **Developer Experience**: Improved tooling and type safety

## Code Examples

### Example Model Implementation: IssueModel.js

```javascript
const BaseModel = require('./BaseModel');

class IssueModel extends BaseModel {
  constructor() {
    super();
  }
  
  /**
   * Create a new issue
   * @param {Object} issueData Issue data
   * @returns {Promise<Object>} Created issue
   */
  async create(issueData) {
    return this.prisma.issue.create({
      data: {
        issueNumber: issueData.issueNumber,
        title: issueData.title,
        templateType: issueData.templateType,
        status: 'open',
        sections: {
          create: Object.entries(issueData.sections || {}).map(([name, content], index) => ({
            name,
            content,
            sequence: issueData.sectionOrder?.[name] || index
          }))
        },
        tasks: {
          create: (issueData.tasks || []).map((task, index) => ({
            description: task.text || task.description,
            completed: task.completed || false,
            sequence: index,
            tags: {
              create: (task.tags || []).map(tag => ({
                name: tag.name,
                prefix: tag.prefix || '#',
                parameters: {
                  create: Object.entries(tag.params || tag.parameters || {}).map(([key, value]) => ({
                    key,
                    value: String(value)
                  }))
                }
              }))
            }
          }))
        }
      },
      include: {
        sections: true,
        tasks: {
          include: {
            tags: {
              include: {
                parameters: true
              }
            }
          }
        }
      }
    });
  }
  
  // Additional methods...
}

module.exports = new IssueModel();
```

### Example Command Implementation: current.js

```javascript
const { Command } = require('commander');
const IssueModel = require('../models/IssueModel');
const TaskModel = require('../models/TaskModel');
const outputManager = require('../utils/outputManager');

async function currentAction() {
  try {
    // Get current issue using model
    const currentIssue = await IssueModel.getCurrent();
    
    if (!currentIssue) {
      outputManager.error('No issues found. Create one first with `issue-cards create`');
      return;
    }
    
    // Find the current task in the issue
    const currentTask = await TaskModel.getCurrentForIssue(currentIssue.id);
    
    if (!currentTask) {
      outputManager.header(`Issue #${currentIssue.issueNumber}: ${currentIssue.title}`);
      outputManager.success('All tasks are complete!');
      return;
    }
    
    // Get context sections
    const problemSection = currentIssue.sections.find(s => s.name === 'Problem to be solved');
    const approachSection = currentIssue.sections.find(s => s.name === 'Planned approach');
    const instructionsSection = currentIssue.sections.find(s => s.name === 'Instructions');
    
    // Display task and context
    outputManager.header('CURRENT TASK:');
    outputManager.task(currentTask.description);
    
    // Display context sections...
    
    // Display upcoming tasks...
  } catch (error) {
    outputManager.error(`Failed to get current task: ${error.message}`);
  }
}

function createCommand() {
  return new Command('current')
    .description('Show the current task with context')
    .action(currentAction);
}

module.exports = { createCommand };
```