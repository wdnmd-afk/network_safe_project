const defaultServerPort = 6667;

type RuntimeEnv = {
  PORT?: NodeJS.ProcessEnv["PORT"];
};

export function getServerPort(env: RuntimeEnv = process.env) {
  const port = Number(env.PORT);

  if (Number.isInteger(port) && port > 0) {
    return port;
  }

  return defaultServerPort;
}
