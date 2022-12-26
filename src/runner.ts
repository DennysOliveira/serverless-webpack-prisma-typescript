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
    this.crawler = new Crawler({});
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
    try {
      console.log("Running sitemap: ", this.sitemap.id);
      if (this.selectors.length === 0) {
        console.log("Getting selectors for sitemap: ", this.sitemap.id);
        await this.getSitemapSelectors();
      }

      console.log(
        `Running ${this.selectors.length} selectors for sitemap ${this.sitemap.id}`
      );

      this.crawler.add(this.sitemap.url);

      this.selectors.forEach((selector) => {
        this.crawler.task(async (page) => {
          await page.waitForNetworkIdle();
          const pageTitle = await page.title();

          return {
            pageTitle,
          }
        });
      });

      const time = await this.crawler.crawl();

      const results = await this.crawler.getResults();
      console.log('Results', results)

      console.log(`Finished running sitemap ${this.sitemap.id} in ${time}ms`);

      const executionResults = await this.prisma.sitemap_result.create({
        data: {
          sitemap_id: this.sitemap.id,
          data: JSON.stringify(results),
        },
      })

      console.log(`Created execution result ${executionResults.id} for sitemap ${this.sitemap.id}`)

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
