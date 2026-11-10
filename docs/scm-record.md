Software Configuration Management Record

1. Project Information

* Project Name: StudentTaskManagement – Library Management System
* Project Type: Web Application
* Technologies: HTML, CSS, JavaScript
* Version: v0.1
* Purpose: To document and manage the configuration items and version history of the project.

2. Configuration Items

CI ID	Configuration Item	Type	Owner	Version/Status
CI-01	index.html	Source Code	Developer	v0.1
CI-02	style.css	Source Code	Developer	v0.1
CI-03	script.js	Source Code	Developer	v0.1
CI-04	README.md	Documentation	SCM Lead	v0.1
CI-05	scm-record.md	Documentation	SCM Lead	v0.1
CI-06	Test cases in the tests folder	Test Artifact	Reviewer	v0.1
CI-07	.gitignore	Configuration File	SCM Lead	v0.1
CI-08	Git repository and commit history	Version Control	SCM Lead	Initialized

3. Version Control

Git is used to track changes, maintain project history, and support collaboration among team members.

4. Baseline

* Baseline Version: v0.1
* Description: Initial project structure, existing source code, project documentation, and configuration files.
* Status: Initial SCM setup.

5. Change Management

Changes to project files should be tracked using Git commits with meaningful messages.

Examples:

* feat: add library management feature
* fix: resolve book registration issue
* docs: update project documentation
* test: add test cases

6. Team Responsibilities

* SCM Lead: Maintains the Git repository and SCM documentation.
* Developers: Develop and maintain the source code.
* Reviewer: Reviews changes and verifies test cases.

7. Current Status

The project already has an existing web application. The SCM tasks focus on documenting its configuration items and managing its files using Git.

# Software Configuration Management Record

## Task 04 – Branching Strategy

### Selected Branching Strategy
The team uses the Feature Branch Workflow.

### Reason for Selection
- Each student can work independently.
- The main branch remains stable.
- Features can be developed separately.
- Changes can be tested before merging.
- It supports teamwork and collaboration.

### Branch Details

**main:**
Stable integrated version of the application.

**feature/CR-02-ui-update:**
Used by Student A for UI development.

**feature/CR-03-validation:**
Used by Student B for validation development.

## Merge, Merge Conflict and Conflict Resolution

The team will merge the developed features into the main branch. A merge conflict may occur when both branches modify the same section of a file. The team will inspect the conflict, resolve it, test the application and record the result.
