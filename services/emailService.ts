
import { SUPABASE_ANON_KEY } from "./supabaseService";

/**
 * --- 📧 THE HANDOFF SERVICE ---
 * 
 * This service initiates the long-running cloud build.
 * It contacts the Supabase Edge Function which handles the synthesis in the background.
 */

export const triggerBackgroundSynthesis = async (
  userId: string, 
  userEmail: string, 
  quizData: any, 
  brief: string,
  imageData: string | null
) => {
  const PROJECT_ID = 'fiviwjynxfhfepwflkdx';
  const EDGE_FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/background-synthesis`;
  
  console.log(`[Cloud Engine] Initiating handoff for: ${userEmail}`);
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY 
      },
      body: JSON.stringify({
        userId,
        userEmail,
        quizData,
        brief,
        imageData
      })
    });

    if (response.ok) {
      console.log("[Cloud Engine] Handoff Successful ✅. Synthesis is running in the cloud.");
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Cloud Engine] Handoff Failed (${response.status}):`, errText);
      return false;
    }
  } catch (err: any) {
    console.error("[Cloud Engine] Network Failure. The background worker may be offline or misconfigured.", err.message);
    return false; 
  }
};
