const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const site = {
  name: "Mohamed Elgazzar",
  url: new URL(configuredUrl),
  reference: "https://www.thisisgazzar.com/en",
};
