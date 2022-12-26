import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { Runner, RunResult } from './runner';
import { APIResponse } from './helpers/response';

const sitemapRoutine = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const prisma = new PrismaClient();

  // Get Sitemaps that nextRun is less than now`
  const sitemaps = await prisma.sitemap.findMany({
    where: {
      nextRun: {
        lte: new Date(),
      },
    },
  });
  
  console.log(`Found ${sitemaps.length} sitemaps to execute.`)

  // Filter size of sitemaps or quantity of sitemaps that should be run by this minute execution (future feature)

  // For each sitemap, boot up an asynchronous Runner
  const promises: Promise<RunResult>[] = [];

  sitemaps.forEach((sitemap) => {
    console.log(`Launching runner for sitemap ${sitemap.id}`)
    const runner = new Runner(sitemap);
    promises.push(runner.run());
  });

  const results = await Promise.all(promises);

  const passing = results.filter((result) => result.success);
  const failing = results.filter((result) => !result.success);

  // Update sitemaps that did run successfully
  const updatedSitemaps = await prisma.sitemap.updateMany({
    where: {
      id: {
        in: passing.map((result) => result.sitemap.id),
      },
    },
    data: {
      lastRun: new Date(),
      nextRun: new Date(new Date().getTime() + 60 * 1000 * 3),
    },
  });

  console.log(`>>> Successfully executed ${passing.length} sitemaps.`)
  console.log(`>>> Failing execution for ${failing.length} sitemaps.`)

  return APIResponse({
    status: 200,
    data: updatedSitemaps
  })
};

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await sitemapRoutine(event);
};

export { handler };
