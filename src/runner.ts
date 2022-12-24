import { sitemap, PrismaClient, selector } from '@prisma/client';
import { Crawler } from './crawler';

export class Runner {
  private readonly sitemap: sitemap;
  private readonly prisma: PrismaClient;
  private readonly crawler: Crawler;
  private selectors: selector[];

  constructor(sitemap: sitemap) {
    this.sitemap = sitemap;
    this.prisma = new PrismaClient();
    this.crawler = new Crawler({
      headless: true,
      maxThreads: 1,
    });
    this.selectors = [];
  }

  public async getSitemapSelectors(): Promise<selector[]> {
    const selectors = await this.prisma.selector.findMany({
      where: {
        sitemap_id: this.sitemap.id,
      },
      orderBy: {
        order: 'asc',
      },
    });

    this.selectors = selectors;

    return selectors;
  }

  public async run(): Promise<void> {
    if (!this.selectors) {
      await this.getSitemapSelectors();
    }

    // Run crawler
    // Start first page with sitemap.url
    // Run first selector on first page
    // Run next selectors on next pages and so on
    // Save results for each page

    this.crawler.add(this.sitemap.url);

    this.selectors.forEach((selector) => {
      this.crawler.task(async (page) => {
        const element = await page.$(selector.data);

        const selectorResult = await page.evaluate((element) => element.textContent, element);

        await this.prisma.sitemap_result.create({
          data: {
            sitemap_id: this.sitemap.id,
            selector_id: selector.id,
            data: selectorResult,
          },
        });

        return selectorResult;
      });
    });

    const results = await this.crawler.crawl();

    // TODO: Update nextRun to now + 1 hour
    await this.prisma.sitemap.update({
      where: {
        id: this.sitemap.id,
      },
      data: {
        nextRun: new Date(new Date().getTime() + 1 * 60 * 60 * 1000),
      },
    });

    console.log(this.selectors);
    console.log(this.sitemap);
  }
}
