import { env } from '../../config/env';
import * as demo from './demoData';

/**
 * Initial application state.
 * Fictional demo data is used ONLY when VITE_ENABLE_DEMO_DATA=true.
 * Otherwise the app starts empty and all data comes from the backend.
 */
const useDemo = env.enableDemoData;

export const INITIAL_USERS = useDemo ? demo.INITIAL_USERS : [];
export const INITIAL_CANDIDATE_PROFILES = useDemo ? demo.INITIAL_CANDIDATE_PROFILES : {};
export const INITIAL_EMPLOYER_PROFILES = useDemo ? demo.INITIAL_EMPLOYER_PROFILES : {};
export const INITIAL_SKILL_CLAIMS = useDemo ? demo.INITIAL_SKILL_CLAIMS : [];
export const INITIAL_ASSESSMENTS = useDemo ? demo.INITIAL_ASSESSMENTS : [];
export const INITIAL_JOBS = useDemo ? demo.INITIAL_JOBS : [];
export const INITIAL_APPLICATIONS = useDemo ? demo.INITIAL_APPLICATIONS : [];
export const INITIAL_WORK_RECORDS = useDemo ? demo.INITIAL_WORK_RECORDS : [];
export const INITIAL_REPORTS = useDemo ? demo.INITIAL_REPORTS : [];
