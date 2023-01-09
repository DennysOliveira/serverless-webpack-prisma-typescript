import { sitemap, PrismaClient, selector } from "@prisma/client";
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export interface RunResult {
  sitemap: sitemap;
  success: boolean;
}

export class Runner {
  private readonly sitemap: sitemap;
  private readonly prisma: PrismaClient;
  private selectors: selector[];

  constructor(sitemap: sitemap) {
    this.sitemap = sitemap;
    this.prisma = new PrismaClient();
    this.selectors = [];
  }

  public async getSitemapSelectors(): Promise<selector[]> {
    const query = {
      where: {
        sitemap_id: this.sitemap.id,
      },
      orderBy: {
        order: "asc",
      }
    }

    const selectors = await this.prisma.selector.findMany({
        where: {
          sitemap_id: this.sitemap.id,
        },
        orderBy: {
          order: "asc",
        },
    });

    this.selectors = selectors;

    return selectors;
  }

  public async run(): Promise<RunResult> {
    const sitemapSelectors = await this.getSitemapSelectors();

    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      executablePath,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
    });

    for(const selector of sitemapSelectors) {

      const page = await browser.newPage();

      await page.goto(this.sitemap.url);

      const title = await page.title();

      await this.prisma.sitemap_result.create({
        data: {
          sitemap_id: this.sitemap.id,
          selector_id: selector.id,
          data: {
            title,
          },
        },
      });
    }

    await browser.close();

    return {
      sitemap: this.sitemap,
      success: true,
    }
  }
}
