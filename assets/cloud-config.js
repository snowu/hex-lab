/* Public Supabase project config (URL + publishable key). Both are public by design: they ship in any browser bundle and
   authorise nothing on their own. Authorisation comes from the signed-in user's JWT plus row-level security
   (see supabase/lab_progress.sql). NEVER put a service-role key here. Delete the values to disable cloud sync. */
window.CLOUD_CONFIG = {
  url: "https://yozllinwvvprtguinflm.supabase.co",
  key: "sb_publishable_FqTiUUOrvfWv6zmwobkcgg_9_d9iyvU",
};
