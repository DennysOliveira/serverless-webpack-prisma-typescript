import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { Runner, RunResult } from './libs/runner';
import { APIResponse } from '@libs/response';



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

  // For now, each invocation will only run one sitemap - so we grab the oldest updated sitemap
  // For each sitemap, boot up an asynchronous Runner
  const runner = new Runner(sitemaps[0]);

  const result = await runner.run();

  console.log(`Execution of sitemap ${sitemaps[0].id} completed:`)
  console.log(JSON.stringify(result, null, 2));

  const updatedSitemaps = await prisma.sitemap.updateMany({
    where: {
      id: {
        in: [sitemaps[0].id]
      },
    },
    data: {
      lastRun: new Date(),
      nextRun: new Date(new Date().getTime() + 60 * 1000 * 60 * 12), // 12 hours from now
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
