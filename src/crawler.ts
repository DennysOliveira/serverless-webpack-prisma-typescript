import puppeteer, { Page, Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium'
import { v4 as uuidv4 } from 'uuid';

interface CrawlerOptions {
  headless?: boolean; // default: true
  maxThreads?: number;
}

interface TaskData {
  task: number;
  worker: Worker;
  url: string;
}

interface Worker {
  id: string;
}

type Task = (page: Page, data?: TaskData) => Promise<any>;

interface Results {
  [url: string]: {
    [task: string]: any;
  };
}

class Crawler {
  private browser: Browser | null;
  private readonly options: CrawlerOptions = {};
  private readonly maxThreads: number;
  private readonly urls: string[] = [];
  private readonly tasks: Task[] = [];
  private readonly results: Results = {};

  constructor(options: CrawlerOptions) {
    this.browser = null;
    this.options = options;
    this.maxThreads = options.maxThreads ? options.maxThreads : 1;
    this.urls = [];
    this.tasks = [];
  }

  public add(url: string | string[]): void {
    if (Array.isArray(url)) {
      this.urls.push(...url);
    } else {
      this.urls.push(url);
    }
  }

  public task(callback: Task | Task[]): number {
    // Return task id based on tasks.length
    if (Array.isArray(callback)) {
      this.tasks.push(...callback);
      return this.tasks.length - 1;
    } else {
      this.tasks.push(callback);
      return this.tasks.length - 1;
    }
  }

  private async genBrowser(): Promise<Browser> {
    console.log('Generating chrome from', await chromium.executablePath);

    const browser = await puppeteer.launch({
      ...this.options,
      executablePath: await chromium.executablePath,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: this.options.headless ? this.options.headless : chromium.headless,
      ignoreHTTPSErrors: true,
    });

    return browser;
  }

  public async crawl(): Promise<number> {
    if (!this.browser) this.browser = await this.genBrowser();

    const executionBeginning = Date.now();

    const threads = [];

    // Do not launch more thread than maxThreads and urls.length
    for (let i = 0; i < Math.min(this.maxThreads, this.urls.length); i++) {
      threads.push(this.launchThread());
    }

    await Promise.all(threads);

    const executionTimeInMs = Date.now() - executionBeginning;

    return executionTimeInMs;
  }

  public async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }


  private async launchThread(): Promise<void> {
    const currentThread: string = uuidv4();

    while (this.urls.length > 0) {
      const url = this.urls.pop() as string;

      if(!this.browser) this.browser = await this.genBrowser();
      const page = await this.browser.newPage();
      await page.goto(url);

      for (let i = 0; i < this.tasks.length; i++) {
        const currentTask = this.tasks[i];

        const result = await currentTask(page, {
          task: i,
          url,
          worker: {
            id: currentThread,
          },
        });

        void page.close();

        if (this.results[url] === undefined) {
          this.results[url] = {};
        }

        this.results[url][i] = result;
      }
    }
  }

  public async getResults(): Promise<Results> {
    return this.results;
  }
}

export { Crawler };
