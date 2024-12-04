# GitHub Trending Archive

## Introduction

This project aims to track and daily archive historical GitHub trending repositories & developers
by most popular programming and markup languages. As GitHub's trending list is constantly
changing and GitHub does not provide API to get this information retrospectively,
this repository helps in maintaining a historical archive using GitHub Actions.

## Another one archive

There are many GitHub Trending archives already, but I've decided to make my own.
All of them doesn't satisfy one or many of my requirements:
1. Store data in JSON.
2. Guarantee of data scraping.
3. Archive must be as small as possible.
4. Archive must include Repositories & Developers.
5. Archive must include `All languages` trends.
6. Archive should include all popular languages.

Detailed motivation could be found in the [FAQ](#faq).

## How it works

The main implementation of this project involves the following steps:
- GitHub Actions: We utilize GitHub Actions to automate the process of updating the archive on a regular basis. You can find the workflow configuration in the `.github/workflows` directory.
- Scraping GitHub Trending: We use web scraping techniques to request and parse GitHub's trending HTML pages for selected languages.
- Data Storage: Extracted data is stored in a structured JSON format in the `archive` directory.

## What languages are supported

**Programming languages**

- C
- C#
- C++
- Dart
- Elixir
- Erlang
- Go
- Haskell
- Java
- JavaScript
- Kotlin
- Lua
- Perl
- PHP
- Python
- R
- Ruby
- Rust
- Scala
- Shell
- Swift
- TypeScript

**Markup languages**

- CSS
- HTML
- Markdown

**Frontend frameworks**

- Svelte
- Vue

**Other**
- HCL (HashiCorp Configuration Language)
- Makefile
- Lua
- WebAssembly

## FAQ

#### Why there are no weekly or monthly trends in repository?

I think that having daily trends we may compute weekly/monthly trends ourselves. 

#### Why there is no meta information like stars count or repository description in the archive?

I've tried to make this archive simple and as small as possible.
All related information may be fetched using GitHub API.

#### Why trends parsing runs hourly, but stored only once a day?

I haven't found description of the GitHub Trends logic.
But, after doing some researches I've made an assumption that daily trends displayed not for today or yesterday,
but in a 24 hours window. For example, when you are opening trending page in 13:00,
you will see trends from 13:00 yesterday to 13:00 today.

Other projects with such functionality updating trends every hour,
but at the end of the day they all will have trends from 23:00 yesterday to 23:00 today.

Running workflows hourly protects us from trends page outage.
If we can't fetch the data, we will try to get it one more time 1 hour later.

#### Why project implemented on TypeScript?

I was inspired by [other project](https://github.com/Leko/github-trending-archive) implemented on TypeScript. Just wanted to reduce time on development.

## License

- `GitHub Trending Archive` project is open-sourced software licensed under the [MIT license](LICENSE) by [Anton Komarev].

## 🌟 Stargazers over time

[![Stargazers over time](https://chart.yhype.me/github/repository-star/v1/890441376.svg)](https://yhype.me?utm_source=github&utm_medium=antonkomarev-github-trending-archive&utm_content=chart-repository-star-cumulative)

## About CyberCog

[CyberCog] is a Social Unity of enthusiasts. Research the best solutions in product & software development is our passion.

- [Follow us on Twitter](https://twitter.com/cybercog)

<a href="https://cybercog.su"><img src="https://cloud.githubusercontent.com/assets/1849174/18418932/e9edb390-7860-11e6-8a43-aa3fad524664.png" alt="CyberCog"></a>

[Anton Komarev]: https://komarev.com
[CyberCog]: https://cybercog.su
