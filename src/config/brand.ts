const calendarEmail = "mailto:contact@bouthouri.co?subject=Schedule%20a%20conversation";
function configuredCalendar(value: string | undefined): string {
  if (!value) return calendarEmail;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : calendarEmail; }
  catch { return calendarEmail; }
}

/** User-approved identity shared by server copy and deferred wordmark rendering. */
export const brand = {
  name: "Med D. Bouthouri",
  owner: "MED D. BOUTHOURI",
  arabicName: "محمد ضياء بوثوري",
  wordmark: "BOUTHOURI",
  email: "contact@bouthouri.co",
  calendarUrl: configuredCalendar(process.env.NEXT_PUBLIC_CALENDAR_URL),
  linkedIn: "https://www.linkedin.com/feed/",
  location: {
    city: "Tunis",
    country: "Tunisia",
    arabicCity: "تونس",
    arabicCountry: "تونس",
    timeZone: "Africa/Tunis",
  },
} as const;
