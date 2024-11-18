import type { Page } from "puppeteer"
import fs from "fs/promises"

export type RepositoryLanguage = {
  label: string
  slug: string
  url: string
}

type Repository = {
  fullName: string
}

const PageUrl = "https://github.com/trending?since=daily"

export class TrendingRepositoryPage {
  private constructor(
      private page: Page,
  ) {}

  static async from(
    page: Page,
    url = PageUrl,
    retry = 0,
  ): Promise<TrendingRepositoryPage> {
    await page.goto(url, { waitUntil: "networkidle2" })
    try {
      await page.waitForSelector("article", { timeout: 5_000 })
    } catch {
      /**
       * There are no trending repositories for this language today.
       */
      if (await page.$(".blankslate")) {
        return new TrendingRepositoryPage(page)
      }
      /**
       * To slip pass the abuse detection.
       */
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      await fs.mkdir('./debug', { recursive: true })
      const language = `${new URL(url).pathname.split("/").at(-1)}`
      await page.screenshot({
        path: `./debug/${language}-retry-${retry}.png`,
      })
      if (retry > 2) {
        throw new Error(`Retry limit exceeded for language ${language}`)
      }
      return TrendingRepositoryPage.from(page, url, retry + 1)
    }
    return new TrendingRepositoryPage(page)
  }

  async getRepositoryLanguageList(): Promise<RepositoryLanguage[]> {
    return this.page
      .$$eval('#languages-menuitems [role="menuitemradio"]', (elements) =>
        elements.map((element) => {
          const url = (element as HTMLAnchorElement).href
          const [slug] = new URL(url).pathname.split("/").slice(-1)
          return {
            label: element.textContent!.trim(),
            slug,
            url,
          }
        })
      )
      .then((result) => [{ url: PageUrl, label: "", slug: "" }].concat(result))
  }

  async getRepositoryList(): Promise<Repository[]> {
    return this.page.$$eval("article", (elements) => {
      return elements.map((element) => {
        const url = (element.querySelector("h2 a") as HTMLAnchorElement)!.getAttribute("href")

        if (url === null) {
          throw Error("Cannot find URL of the repository")
        }

        const fullName = url.startsWith('/') ? url.slice(1) : url

        return {
          fullName,
        }
      })
    })
  }

  close() {
    return this.page.close()
  }
}
