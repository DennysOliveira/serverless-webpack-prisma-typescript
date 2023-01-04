import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { Runner, RunResult } from './runner';
import { APIResponse } from './helpers/response';
import { Crawler } from './crawler';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const sitemapRoutine = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const executablePath = await chromium.executablePath;

  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.goto('https://www.google.com');

  const title = await page.title();

  console.log(title);

  await browser.close();


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda!',
      title,
    }),
  }
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
  const runner = new Runner(sitemaps[0]);

  const result = await runner.run();

  console.log(result);

  // Update sitemaps that did run successfully
  const updatedSitemaps = await prisma.sitemap.updateMany({
    where: {
      id: {
        in: [sitemaps[0].id]
      },
    },
    data: {
      lastRun: new Date(),
      nextRun: new Date(new Date().getTime() + 60 * 1000 * 3),
    },
  });


  console.log(`Updated ${updatedSitemaps.count} sitemaps.`)
  
  return APIResponse({
    status: 200,
    data: updatedSitemaps
  })
};

const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await sitemapRoutine(event);
};

export { handler };
