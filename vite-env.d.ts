// Replaced broken vite/client reference with manual declarations
declare module "*.css";

// Declare process.env to match Google GenAI guidelines usage
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
