import fs from "fs/promises"
import path from "path"
import puppeteer from "puppeteer"
import Bottleneck from "bottleneck"
import {RepositoryLanguage, TrendingRepositoryPage} from "./scraper/TrendingRepositoryPage"
import {DeveloperLanguage, TrendingDeveloperPage} from './scraper/TrendingDeveloperPage'

const CONCURRENCY = 10
const ALLOW_LANGUAGES = [
    // Programming language
    "C",
    "C#",
    "C++",
    "Dart",
    "Elixir",
    "Erlang",
    "Go",
    "Haskell",
    "Java",
    "JavaScript",
    "Kotlin",
    "Lua",
    "Perl",
    "PHP",
    "Python",
    "R",
    "Ruby",
    "Rust",
    "Scala",
    "Shell",
    "Swift",
    "TypeScript",
    // Markup language
    "CSS",
    "HTML",
    "Markdown",
    // Frontend framework
    "Svelte",
    "Vue",
    // etc
    "HCL",
    "Makefile",
    "Lua",
    "WebAssembly",
]

const ARCHIVE_TYPE = process.argv[2]
const ARCHIVE_DIR_PATH = process.argv[3]

async function main() {
    switch (ARCHIVE_TYPE) {
        case 'developer':
            await processDeveloperArchive()
            break;
        case 'repository':
            await processRepositoryArchive()
            break;
        default:
            throw Error("Unsupported archive type")
    }
}

async function processDeveloperArchive() {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
        const limiter = new Bottleneck({
            maxConcurrent: CONCURRENCY,
        })
        const entry = await TrendingDeveloperPage.from(await browser.newPage())
        const languages = await entry.getDeveloperLanguageList()
        const allLanguagesResult = {
            language: '',
            items: await entry.getDeveloperList().finally(() => entry.close()),
        }
        const resultList = await Promise.all(
            languages
                .filter((language: DeveloperLanguage) => ALLOW_LANGUAGES.includes(language.label))
                .map((language: DeveloperLanguage) => {
                    return limiter.schedule(async () => {
                        const page = await browser.newPage()
                        const fetcher = await TrendingDeveloperPage.from(page, language.url)
                        return {
                            language: language.slug,
                            items: await fetcher.getDeveloperList().finally(() => fetcher.close()),
                        }
                    })
                }),
        )
        resultList.push(allLanguagesResult)
        await persistDeveloper(resultList, ARCHIVE_DIR_PATH)
    } finally {
        await browser.close()
    }
}

async function persistDeveloper(
    resultList: {
        language: string
        items: Record<string, any>[]
    }[],
    dir: string,
) {
    await fs.mkdir(dir, {recursive: true})
    return Promise.all(
        resultList.map(async (result) => {
            const language = (result.language !== '')
                ? decodeURIComponent(result.language)
                : null
            const fileName = language ?? '(null)'
            const filePath = path.join(dir, `${fileName}.json`)
            const dataToWrite = {
                date: getToday(),
                language: language,
                list: result.items.map(developer => developer.username),
            }
            await fs.writeFile(filePath, JSON.stringify(dataToWrite), "utf-8")
            console.log(`${fileName} — ${result.items.length} items`)
        }),
    )
}

async function processRepositoryArchive() {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
        const limiter = new Bottleneck({
            maxConcurrent: CONCURRENCY,
        })
        const entry = await TrendingRepositoryPage.from(await browser.newPage())
        const repositoryLanguageList = await entry.getRepositoryLanguageList()
        const allLanguagesResult = {
            language: '',
            items: await entry.getRepositoryList().finally(() => entry.close()),
        }
        const resultList = await Promise.all(
            repositoryLanguageList
                .filter((language: RepositoryLanguage) => ALLOW_LANGUAGES.includes(language.label))
                .map((language: RepositoryLanguage) => {
                    return limiter.schedule(async () => {
                        const page = await browser.newPage()
                        const fetcher = await TrendingRepositoryPage.from(page, language.url)
                        return {
                            language: language.slug,
                            items: await fetcher.getRepositoryList().finally(() => fetcher.close()),
                        }
                    })
                }),
        )
        resultList.push(allLanguagesResult)
        await persistRepository(resultList, ARCHIVE_DIR_PATH)
    } finally {
        await browser.close()
    }
}

async function persistRepository(
    resultList: {
        language: string
        items: Record<string, any>[]
    }[],
    dir: string,
) {
    await fs.mkdir(dir, {recursive: true})
    return Promise.all(
        resultList.map(async (result) => {
            const language = (result.language !== '')
                ? decodeURIComponent(result.language)
                : null
            const fileName = language ?? '(null)'
            const filePath = path.join(dir, `${fileName}.json`)
            const dataToWrite = {
                date: getToday(),
                language: language,
                list: result.items.map(repository => repository.fullName),
            }
            await fs.writeFile(filePath, JSON.stringify(dataToWrite), "utf-8")
            console.log(`${fileName} — ${result.items.length} items`)
        }),
    )
}

function getToday() {
    const now = new Date()
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map((n) => String(n).padStart(2, "0"))
        .join("-")
}

main().catch((e) => {
    console.error(e.stack)
    process.exit(1)
})
