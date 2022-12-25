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
    promises.push(new Runner(sitemap).run());
  });

  const results = await Promise.allSettled(promises);

  const fullfilled = results.filter((result) => result.status === 'fulfilled') as PromiseFulfilledResult<RunResult>[];
  const rejected = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[];

  // Update sitemaps that did run successfully
  const updatedSitemaps = await prisma.sitemap.updateMany({
    where: {
      id: {
        in: fullfilled.map((result) => result.value.sitemap.id),
      },
    },
    data: {
      lastRun: new Date(),
      nextRun: new Date(new Date().getTime() + 60 * 1000 * 10),
    },
  });

  console.log(`Updated ${updatedSitemaps.count} sitemaps.`)
  console.log(`Could not run ${rejected.length} sitemaps.`)

  return APIResponse({
    status: 200,
    data: updatedSitemaps
  })
};

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await sitemapRoutine(event);
};

export { handler };
