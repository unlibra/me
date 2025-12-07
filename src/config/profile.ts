export const profile = {
  name: import.meta.env.PUBLIC_PROFILE_NAME || "unlibra",
  username: import.meta.env.PUBLIC_PROFILE_USERNAME || "unlibra",
  location: "Tokyo, Japan",
  website: "https://github.com/unlibra",
  sponsor: "https://ofuse.me/unlibra",
} as const;
