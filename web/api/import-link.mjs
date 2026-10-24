import {createHandler} from '../server/link-import.mjs';
export default {fetch:createHandler({supabaseURL:process.env.VITE_SUPABASE_URL,publishableKey:process.env.VITE_SUPABASE_PUBLISHABLE_KEY})};
