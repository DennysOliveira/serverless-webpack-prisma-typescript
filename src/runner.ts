import { sitemap, PrismaClient, selector } from "@prisma/client";
import { Crawler } from "./crawler";

export interface RunResult {
  sitemap: sitemap;
  success: boolean;
}

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
        order: "asc",
      },
    });

    this.selectors = selectors;

    return selectors;
  }

  public async run(): Promise<RunResult> {
    try {
      console.log("Running sitemap: ", this.sitemap.id);
      if (!this.selectors) {
        await this.getSitemapSelectors();
      }

      console.log(
        `Running ${this.selectors.length} selectors for sitemap ${this.sitemap.id}`
      );

      this.crawler.add(this.sitemap.url);

      this.selectors.forEach((selector) => {
        this.crawler.task(async (page) => {
          const element = await page.$(selector.data);

          await page.waitForNetworkIdle();

          const selectorResult = await page.evaluate(
            (element) => element.textContent,
            element
          );

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


      console.log(this.selectors);
      console.log(this.sitemap);

      if (results) {
        return {
          sitemap: this.sitemap,
          success: true,
        };
      }

      return {
        sitemap: this.sitemap,
        success: false,
      };

    } catch (error) {
      console.log(`Error running sitemap ${this.sitemap.id}`);
      console.log(error);
      return {
        sitemap: this.sitemap,
        success: false,
      };
    }
  }
}
