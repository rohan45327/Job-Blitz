# JobBlitz — Office Kit Architecture Specification

## 1. Concept & Compute Bridge Narrative

Office Kit is a **Compute Extension Bridge** between the mobile phone (primary user interface & rapid interaction device) and the laptop companion (heavy compute workstation).

```mermaid
sequenceDiagram
    participant Phone as iQOO Phone (Primary UI)
    participant Bridge as Office Kit Bridge (Local Protocol)
    participant Laptop as Laptop Workstation

    Note over Phone: User selects "Deep Analysis Mode" for a 25-page role dossier
    Phone->>Bridge: Send Heavy Workload Payload (JSON + PDF Bytes)
    Bridge->>Laptop: Dispatch to Heavy Local RAG Engine
    Note over Laptop: Parse PDF, cross-reference 50 candidate signals, run large local LLM
    Laptop-->>Bridge: Return Deep Intelligence Result JSON
    Bridge-->>Phone: Push Result to Mobile Screen
    Note over Phone: Display "Deep Intelligence Complete" & render readiness breakdown
```

## 2. Dual-Mode Specification

### 2.1 FAST MODE (Phone / NPU - Red Light Capable)
- Runs 100% locally on the phone using Snapdragon NPU / local CPU.
- Zero network dependency.
- **Tasks**:
  - Instant job feed match scoring.
  - Skill gap extraction.
  - Camera OCR job flyer scanning.
  - 1-minute voice STAR interview feedback.

### 2.2 DEEP ANALYSIS MODE (Office Kit / Laptop - Green Light Enhanced)
- Triggered explicitly via UI toggle: `[DEEP ANALYSIS — Office Kit Active]`.
- Communicates via local high-speed HTTP / WebSocket server running on the laptop.
- **Tasks**:
  - Multi-page PDF resume & portfolio deep analysis.
  - Cross-referencing 50+ public hiring signals for target MNCs.
  - Multi-job bulk comparison matrix generation.
  - Full company dossier synthesis.

## 3. Graceful Fallback Protocol
If the laptop connection drops or Office Kit becomes unreachable:
1. Mobile app displays a subtle status pill: `[OFFICE KIT OFFLINE — Running in Fast On-Device Mode]`.
2. Model Router automatically reroutes pending requests to `LocalNPU` or `LocalCPU` without crashing or freezing the mobile UI.
