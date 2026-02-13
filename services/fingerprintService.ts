
export const getDeviceFingerprint = async (): Promise<string> => {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    (navigator as any).hardwareConcurrency || 'unknown',
    'v1' // Versioning for the fingerprint logic
  ].join('###');

  // Simple hash function for the prototype
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `LPD-${Math.abs(hash).toString(16).toUpperCase()}`;
};
