
/**
 * --- 🛑 STRIPE PRODUCTION SETUP ---
 * 
 * 1. Log in to Stripe Dashboard.
 * 2. Go to Payments -> Payment Links.
 * 3. Find your link (cNibJ0dMqf0QdAFcRJ53O01) and click Edit.
 * 4. At the TOP of the screen, click the "After payment" tab.
 * 5. Select "Don't show confirmation page".
 * 6. For the URL, enter exactly: 
 *    https://launchpadai.click/?payment_success=true
 * 7. Click "Update link" in the top right.
 * 
 * --- 🏛️ CUSTOMER PORTAL SETUP (For Cancellations) ---
 * 1. Go to Stripe Dashboard -> Settings -> Billing -> Customer Portal.
 * 2. Ensure "Activate the link to the customer portal" is TOGGLED ON.
 * 3. Under "Subscriptions", check "Allow customers to cancel subscriptions".
 * 4. Copy the "Direct link" (it looks like https://billing.stripe.com/p/login/...)
 * 5. Replace the STRIPE_CUSTOMER_PORTAL constant below with your link.
 */

export const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/cNibJ0dMqf0QdAFcRJ53O01"; 

// IMPORTANT: Replace this with your actual LIVE portal link from Stripe Settings -> Customer Portal
export const STRIPE_CUSTOMER_PORTAL = "https://billing.stripe.com/p/login/fZu6oGfUy5qg9kp4ld53O00";

export const initiateStripeCheckout = async (): Promise<void> => {
  // Opening in a new tab is required because Stripe blocks being loaded inside iframes
  window.open(STRIPE_PAYMENT_LINK, '_blank');
  return Promise.resolve();
};

export const openCustomerPortal = () => {
  // Opening in a new tab is required because Stripe blocks being loaded inside iframes
  window.open(STRIPE_CUSTOMER_PORTAL, '_blank');
};
