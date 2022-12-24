import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { Runner } from './runner';
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
  const runners = sitemaps.map(async (sitemap) => {
    const runner = new Runner(sitemap);
    await runner.run();
  });

  // Wait for all runners to finish
  await Promise.all(runners);

  // Update nextRun to now + 12 hours
  const updatedSitemaps = await prisma.sitemap.updateMany({
    where: {
      id: {
        in: sitemaps.map((sitemap) => sitemap.id),
      },
    },
    data: {
      nextRun: new Date(new Date().getTime() + 12 * 60 * 60 * 1000),
    },
  });

  return APIResponse({
    status: 200,
    data: updatedSitemaps
  })
};

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await sitemapRoutine(event);
};

export { handler };
