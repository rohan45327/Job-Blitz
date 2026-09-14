# JobBlitz — Data Provenance & Trust System

## 1. Core Principle

JobBlitz enforces strict data provenance and evidence attribution for every insight presented to the user. No fabricated statistics, fake candidate profiles, or unverified hiring claims are allowed.

## 2. Provenance Classification Tags

| Provenance Tag | Visual Badge | Description | Example |
| :--- | :--- | :--- | :--- |
| **OFFICIAL** | `[OFFICIAL]` (Blue) | Direct data from official company career portals or ATS endpoints. | *"Job posted on Greenhouse 18m ago. Requires Python & PostgreSQL."* |
| **PUBLIC SIGNAL** | `[PUBLIC SIGNAL]` (Orange) | Aggregated, public hiring data or candidate reports from authorized feeds. | *"Public interview signals indicate System Design is asked in 75% of technical rounds."* |
| **USER CONTRIBUTION** | `[USER CONTRIB]` (Purple) | Voluntary, anonymized data contributed by users within the system. | *"Verified STAR response template for backend scaling."* |
| **AI INFERENCE** | `[AI INFERENCE]` (Cyan) | Algorithmic calculation or AI synthesis based on factual data. | *"Recommended: Prepare 45-min System Design roadmap before technical screen."* |

## 3. Evidence Panel Interface

Every major recommendation in JobBlitz includes a **"Why this score?" / "View Evidence"** button. Clicking this reveals the **Evidence Panel Modal**, displaying:
- Exact requirement matched
- Source type and provenance tag
- Verification timestamp
- Confidence rating (High, Medium, Low)

If data is insufficient for a company or role, JobBlitz explicitly displays:
> **"Not enough reliable data available for this company signal."**
