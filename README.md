Problem statement: Autonomous multi agent investigation and discovery system
"Most existing AI applications operate within predefined objectives and depend on humans to specify the problems they need to solve. They are designed to analyse known issues rather than independently discover previously unknown ones."

---- understanding the problem

The proposed system will consist of multiple specialised AI agents that collaboratively perform autonomous exploration, hypothesis generation, evidence collection, critical validation, and investigation prioritisation. The system should be capable of identifying hidden relationships and overlooked dependencies between seemingly unrelated events, generating new hypotheses from these discoveries, and initiating further investigations to validate them.

The ultimate objective is to develop an intelligent system that goes beyond task execution and demonstrates autonomous problem discovery, evidence-driven reasoning, and adaptive investigation.


 --- The main USE CASES
Upload a software repository.
Provide application logs.
Connect a GitHub repository.
Upload technical documentation.
Provide system performance data.

1. Upload a software repository – Analyse source code, functions, classes and modules to identify unusual patterns, potential bugs and hidden relationships.

2. Connect a GitHub repository – Investigate commits, pull requests, code changes and repository history to discover suspicious modifications or recurring issues.

3. Provide application logs – Examine application errors, exceptions and recurring failures to identify unusual behaviour.

4. Provide server logs – Investigate server failures, unexpected events and patterns across multiple services.

5. Upload dependency files – Analyse dependencies such as package.json, requirements.txt and pom.xml to identify conflicts, outdated packages and dependency relationships.

6. Provide system performance data – Investigate CPU usage, memory consumption, response times and performance degradation.

7. Upload API documentation – Examine API endpoints, request-response structures and dependencies to identify inconsistencies or compatibility issues.

8. Provide database schemas – Investigate table relationships, constraints and database structures to identify potential design issues.

9. Upload SQL query logs – Analyse slow queries, repeated operations and unusual database access patterns.

10. Provide software testing reports – Investigate failed test cases, recurring failures and relationships between different test results.

11. Provide distributed system traces – Examine requests travelling across multiple services to discover latency issues and hidden failure dependencies.

12. Upload system architecture documents – Analyse architectural components, service interactions and dependencies to identify potential design conflicts.

13. Upload technical research papers – Explore connections between research findings, identify contradictory results and generate new research questions.

14. Provide data pipeline configurations – Investigate data-processing workflows, transformation errors and broken dependencies.

15. Upload configuration files – Examine application settings, environment variables and service configurations to discover conflicting or incorrect settings.

16. Provide application crash reports – Investigate crash patterns, recurring exceptions and possible root causes.

17. Connect issue trackers – Analyse GitHub Issues, Jira tickets or bug reports to discover recurring problems and relationships between reported issues.

18. Upload security audit reports – Investigate reported vulnerabilities, related components and possible connections between security findings.

19. Provide build and deployment logs – Analyse failed builds, deployment errors and inconsistencies across software versions.

20. Upload technical design specifications – Compare expected system behaviour with implementation details to identify missing requirements and design inconsistencies.

---- The framework:

user interface 
application layer
multi agent orchestration
intelligence and investigation engine
data and knowledge layer
external tools and data source

Front end:
react js

backend :
python and fast API's

Agentic AI Engine – LangGraph


the agents:
1. Explorer Agent: this explores the data
2. Hypothesis Agent : This develops the explainations
3. Investigator Agent : This gathers the evidence 
4. Challenger Agent : It questions the findings
5. Coordinator Agent : It identifies the strongest investigation and allocates further attention to it. This agent makes the decision.

The website layout is :
frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── assets/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
└── package.json
 


