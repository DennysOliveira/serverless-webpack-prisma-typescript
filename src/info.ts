import { join } from "path";

const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      dirname: __dirname,
      cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
    }),
  };
}

export { handler }