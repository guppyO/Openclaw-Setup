export interface RuntimeEnvironment {
  repoRoot: string;
  nodeEnv: string;
  port: number;
  timezone: string;
  wiseBaseUrl: string;
}

export function getRuntimeEnvironment(): RuntimeEnvironment {
  return {
    repoRoot: process.cwd(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number.parseInt(process.env.REVENUE_OS_PORT ?? "4310", 10),
    timezone: process.env.REVENUE_OS_TIMEZONE ?? "Europe/London",
    wiseBaseUrl: process.env.WISE_BASE_URL ?? "https://api.wise.com",
  };
}
