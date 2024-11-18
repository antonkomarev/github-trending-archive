import type { Page } from "puppeteer"
import fs from "fs/promises"

export type DeveloperLanguage = {
  label: string
  slug: string
  url: string
}

type Developer = {
  username: string
}

const PageUrl = "https://github.com/trending/developers?since=daily"

const DEVELOPER_ROW_SELECTOR = 'article.Box-row'

export class TrendingDeveloperPage {
  private constructor(
      private page: Page,
  ) {}

  static async from(
    page: Page,
    url = PageUrl,
    retry = 0,
  ): Promise<TrendingDeveloperPage> {
    await page.goto(url, { waitUntil: "networkidle2" })
    try {
      await page.waitForSelector(DEVELOPER_ROW_SELECTOR, { timeout: 5_000 })
    } catch {
      /**
       * There are no trending developers for this language today.
       */
      if (await page.$(".blankslate")) {
        return new TrendingDeveloperPage(page)
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
      return TrendingDeveloperPage.from(page, url, retry + 1)
    }
    return new TrendingDeveloperPage(page)
  }

  async getDeveloperLanguageList(): Promise<DeveloperLanguage[]> {
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

  async getDeveloperList(): Promise<Developer[]> {
    return this.page.$$eval(DEVELOPER_ROW_SELECTOR, (elements) => {
      return elements.map((element) => {
        const url = (element.querySelector("h1 a") as HTMLAnchorElement)!.getAttribute("href")

        if (url === null) {
          throw Error("Cannot find URL of the developer")
        }

        const username = url.startsWith('/') ? url.slice(1) : url

        return {
          username: username,
        }
      })
    })
  }

  close() {
    return this.page.close()
  }
}
