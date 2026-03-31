import axios from 'axios';

const defaultApiUrl=import.meta.env.DEV ? 'http://localhost:5002' : '';
const API_URL=import.meta.env.VITE_API_URL||defaultApiUrl;

export const executeCode=(payload) => axios.post(`${API_URL}/api/code-execution/execute`, payload);
export const submitCode=(payload) => axios.post(`${API_URL}/api/code-execution/submit`, payload);
export const sendProctoringEvent=(interviewId, event) => axios.post(`${API_URL}/api/proctoring/event`, {
  interviewId,
  eventType: event.type,
  severity: event.severity,
  details: event.description,
});

export const getQuizById=(quizId) => axios.get(`${API_URL}/api/quizzes/${quizId}`);
export const submitQuizAttempt=(quizId, payload) => axios.post(`${API_URL}/api/quizzes/${quizId}/attempt`, payload);
export const getQuizAttemptById=(attemptId) => axios.get(`${API_URL}/api/quizzes/attempt/${attemptId}`);
export const getQuizzes=() => axios.get(`${API_URL}/api/quizzes`);

export const getFrameworkFeatures=() => axios.get(`${API_URL}/api/framework/ai-features`);
export const createFrameworkSession=(payload) => axios.post(`${API_URL}/api/framework/session`, payload);
export const sendFrameworkSignal=(sessionId, payload) => axios.post(`${API_URL}/api/framework/session/${sessionId}/signal`, payload);
export const evaluateFrameworkSession=(sessionId, payload) => axios.post(`${API_URL}/api/framework/session/${sessionId}/evaluate`, payload);
export const sendTelemetryFrame=(payload) => axios.post(`${API_URL}/api/telemetry/frame`, payload);
