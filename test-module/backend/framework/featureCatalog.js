export const uniqueAIFeatureCatalog=[
  {
    id: 'telemetry_fused_authenticity',
    title: 'Telemetry-Fused Authenticity Scoring',
    capability: 'Scores solution authenticity by fusing editor events, run history, focus shifts, and copy/paste traces in real-time.',
    whyStandaloneModelsFallShort: 'Chat assistants do not have direct first-party event streams from your secure exam runtime.',
  },
  {
    id: 'live_session_drift_guard',
    title: 'Live Session Drift Guard',
    capability: 'Detects sudden code-style drift and timing anomalies inside one session, then dynamically increases verification checks.',
    whyStandaloneModelsFallShort: 'Requires continuous behavioral baselining over live user signals rather than static prompt text.',
  },
  {
    id: 'question_adaptive_proctoring',
    title: 'Question-Adaptive Proctoring',
    capability: 'Changes violation sensitivity based on question type, difficulty, and elapsed time to reduce false positives.',
    whyStandaloneModelsFallShort: 'Needs runtime context from the active test engine and policy layer, not just language generation.',
  },
  {
    id: 'offline_replay_audit',
    title: 'Deterministic Replay Audit',
    capability: 'Replays the complete attempt timeline (events, edits, test runs) to provide recruiter-grade evidence snapshots.',
    whyStandaloneModelsFallShort: 'Needs deterministic event storage and replay primitives from your platform infrastructure.',
  },
  {
    id: 'risk_aware_scoring_blend',
    title: 'Risk-Aware Scoring Blend',
    capability: 'Computes final score by blending correctness, code quality, and integrity risk confidence.',
    whyStandaloneModelsFallShort: 'Needs trusted scoring hooks tied to your compiler/test harness and security pipeline.',
  },
];
