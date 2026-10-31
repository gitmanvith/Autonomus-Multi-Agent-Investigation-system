from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search , scrape_url 
from dotenv import load_dotenv
import os

load_dotenv()

#model setup — Ollama (local LLM)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

llm = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    timeout=8,
)


#1st agent 
def build_search_agent():
    return create_agent(
        model = llm,
        tools= [web_search]
    )

#2nd agent 

def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url]
    )


#writer chain 

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

#critic_chain 

critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 3rd agent — Hypothesis Generator (tool-based)
# Generates testable hypotheses from research findings.
# ---------------------------------------------------------------------------
def build_hypothesis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 4th agent — Evidence Collector (tool-based)
# Collects and organises supporting evidence for a claim.
# ---------------------------------------------------------------------------
def build_evidence_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 5th agent — Fact Checker (tool-based)
# Verifies claims and facts against retrieved sources.
# ---------------------------------------------------------------------------
def build_fact_checker_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 6th agent — Source Evaluator (tool-based)
# Evaluates the credibility and reliability of information sources.
# ---------------------------------------------------------------------------
def build_source_evaluator_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 7th agent — Anomaly Detector (tool-based)
# Detects unusual patterns, outliers and suspicious signals in data.
# ---------------------------------------------------------------------------
def build_anomaly_detector_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 8th agent — Trend Analyzer (tool-based)
# Identifies emerging trends and patterns over time.
# ---------------------------------------------------------------------------
def build_trend_analyzer_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 9th chain — Timeline Builder (chain-based)
# Builds a chronological timeline of events from research content.
# ---------------------------------------------------------------------------
timeline_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a timeline construction expert. Build clear, chronological timelines from research content."),
    ("human", """Construct a chronological timeline of events from the research below.

Topic: {topic}

Research Content:
{research}

Structure the timeline as:
- Date/Period: Event description and significance
- ...
- Key turning points
- Causal chain (how events led to one another)

Be precise, factual and well-ordered."""),
])

timeline_chain = timeline_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 10th chain — Relationship Mapper (chain-based)
# Maps connections, dependencies and relationships between entities.
# ---------------------------------------------------------------------------
relationship_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a relationship-mapping specialist. Identify hidden connections and dependencies between entities, events and findings."),
    ("human", """Map the relationships between entities, events and findings in the research below.

Topic: {topic}

Research Content:
{research}

Structure the output as:
- Entities involved (people, organisations, systems, events)
- Direct relationships (A → B, with nature of connection)
- Indirect dependencies (hidden or overlooked links)
- Cluster of related findings
- Summary of the most significant relationship

Be specific and cite evidence from the research where possible."""),
])

relationship_chain = relationship_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 11th chain — Risk Assessor (chain-based)
# Assesses risks, threats and severity levels associated with findings.
# ---------------------------------------------------------------------------
risk_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a risk assessment specialist. Evaluate risks, threats and severity associated with research findings."),
    ("human", """Assess the risks and threats in the research below.

Topic: {topic}

Research Content:
{research}

Structure the assessment as:
- Identified risks (with description)
- Likelihood (High/Medium/Low) and justification
- Impact severity (High/Medium/Low) and justification
- Overall risk score (X/10)
- Mitigation recommendations
- Priority risks requiring immediate attention

Be objective and evidence-based."""),
])

risk_chain = risk_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 12th chain — Impact Analyzer (chain-based)
# Analyses the impact and consequences of research findings.
# ---------------------------------------------------------------------------
impact_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an impact analysis specialist. Evaluate the consequences and impact of research findings across stakeholders."),
    ("human", """Analyse the impact of the findings in the research below.

Topic: {topic}

Research Content:
{research}

Structure the analysis as:
- Direct impacts (immediate consequences)
- Indirect impacts (downstream effects)
- Stakeholders affected (and how)
- Short-term vs long-term impact
- Magnitude of impact (Minor/Moderate/Major/Critical)
- Areas requiring further monitoring

Be thorough and balanced."""),
])

impact_chain = impact_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 13th chain — Report Summarizer (chain-based)
# Summarises long research reports into concise overviews.
# ---------------------------------------------------------------------------
summarizer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert summariser. Create concise, accurate summaries of research reports."),
    ("human", """Summarise the research report below into a concise overview.

Topic: {topic}

Report:
{report}

Structure the summary as:
- One-sentence executive summary
- Key findings (bullet points, 3-5 items)
- Critical evidence
- Main conclusion
- Recommended next steps

Keep it under 300 words and easy to read at a glance."""),
])

summarizer_chain = summarizer_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 14th chain — Executive Summary Generator (chain-based)
# Creates executive-summary style briefings for leadership.
# ---------------------------------------------------------------------------
executive_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an executive briefing specialist. Produce high-level summaries suitable for decision-makers."),
    ("human", """Create an executive summary briefing from the research below.

Topic: {topic}

Research Content:
{research}

Structure the briefing as:
- Bottom line up front (BLUF): 2-3 sentences
- Situation overview
- Key findings relevant to decision-making
- Risks and opportunities
- Recommended actions with priority
- Required resources or dependencies

Write for a time-poor executive audience: clear, direct, action-oriented."""),
])

executive_chain = executive_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 15th chain — Citation Formatter (chain-based)
# Formats citations and references in a consistent academic style.
# ---------------------------------------------------------------------------
citation_system = (
    "You are a citation formatting specialist. "
    "Format the sources below into a consistent, properly styled reference list "
    "(APA-style where possible), including author, date, title, source and URL. "
    "Group by source type and alphabetise within each group."
)


def build_citation_formatter(sources: str) -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", citation_system),
        ("human", "Sources to format:\n{sources}"),
    ])
    chain = prompt | llm | StrOutputParser()
    return chain.invoke({"sources": sources})


# ---------------------------------------------------------------------------
# 16th chain — Translation Agent (chain-based)
# Translates research content between languages.
# ---------------------------------------------------------------------------
translation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a professional translator. Translate research content accurately while preserving technical terminology and nuance."),
    ("human", """Translate the research content below from English to {target_language}.

Content:
{content}

Requirements:
- Preserve all technical terms, proper nouns and URLs
- Maintain the original tone and structure
- Do not add or omit information
- Flag any terms that are difficult to translate accurately

Provide only the translation, no extra commentary."""),
])

translation_chain = translation_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 17th chain — Recommendation Agent (chain-based)
# Provides actionable recommendations based on research findings.
# ---------------------------------------------------------------------------
recommendation_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a strategic recommendations specialist. Convert research findings into concrete, actionable recommendations."),
    ("human", """Based on the research below, produce actionable recommendations.

Topic: {topic}

Research Content:
{research}

Structure the recommendations as:
- Immediate actions (0-30 days)
- Short-term actions (1-3 months)
- Medium-term actions (3-12 months)
- Long-term strategic initiatives (12+ months)
- For each: owner suggestion, required resources, expected outcome, success metric
- Risks of inaction

Prioritise by impact and feasibility."""),
])

recommendation_chain = recommendation_prompt | llm | StrOutputParser()


# ---------------------------------------------------------------------------
# 21st agent — Coordinator Agent (tool-based)
# Identifies the strongest investigation and allocates further attention.
# ---------------------------------------------------------------------------
def build_coordinator_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 22nd agent — Investigator Agent (tool-based)
# Gathers evidence for investigation claims and hypotheses.
# ---------------------------------------------------------------------------
def build_investigator_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 23rd agent — Code Analysis Agent (tool-based)
# Analyses source code for unusual patterns, bugs and hidden relationships.
# ---------------------------------------------------------------------------
def build_code_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 24th agent — Log Analysis Agent (tool-based)
# Examines application and server logs for errors and recurring failures.
# ---------------------------------------------------------------------------
def build_log_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 25th agent — Security Analysis Agent (tool-based)
# Investigates reported vulnerabilities and security findings.
# ---------------------------------------------------------------------------
def build_security_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 26th agent — Dependency Analysis Agent (tool-based)
# Analyses dependencies for conflicts, outdated packages and relationships.
# ---------------------------------------------------------------------------
def build_dependency_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 27th agent — Performance Analysis Agent (tool-based)
# Investigates CPU, memory, response times and performance degradation.
# ---------------------------------------------------------------------------
def build_performance_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 28th agent — API Analysis Agent (tool-based)
# Examines API endpoints and request-response structures for inconsistencies.
# ---------------------------------------------------------------------------
def build_api_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 29th agent — Database Analysis Agent (tool-based)
# Investigates table relationships, constraints and database structures.
# ---------------------------------------------------------------------------
def build_database_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 30th agent — Test Analysis Agent (tool-based)
# Investigates failed test cases and recurring test failures.
# ---------------------------------------------------------------------------
def build_test_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 31st agent — Evaluation Agent (tool-based)
# Evaluates investigation findings against criteria, scoring quality and completeness.
# ---------------------------------------------------------------------------
def build_evaluation_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 32nd agent — Report Generator Agent (tool-based)
# Generates comprehensive investigation reports from gathered evidence and findings.
# ---------------------------------------------------------------------------
def build_report_generator_agent():
    return create_agent(
        model=llm,
        tools=[web_search, scrape_url],
    )


# ---------------------------------------------------------------------------
# 18th agent — Challenger Agent (tool-based)
# Questions findings, plays devil's advocate and stress-tests conclusions.
# ---------------------------------------------------------------------------
def build_challenger_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 19th agent — Data Analysis Agent (tool-based)
# Analyses structured and unstructured data for patterns, statistics and insights.
# ---------------------------------------------------------------------------
def build_data_analysis_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )


# ---------------------------------------------------------------------------
# 20th agent — Relationship Discovery Agent (tool-based)
# Discovers hidden relationships and dependencies between seemingly unrelated entities.
# ---------------------------------------------------------------------------
def build_relationship_discovery_agent():
    return create_agent(
        model=llm,
        tools=[web_search],
    )