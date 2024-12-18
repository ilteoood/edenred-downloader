import { Page, test } from '@playwright/test';
import dotenv from 'dotenv';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { setTimeout } from 'timers/promises';

dotenv.config();

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INITIAL_URL: string;
    }
  }
}

const retrieveBarCode = (page: Page) => page.locator('.codeLine').innerText()
const retrieveNextPageButton = (page: Page) => page.locator('.pagerContainer > div > div:nth-child(5) > a > img')

const hasNextPage = async (page: Page) => {
  const nextPageButton = retrieveNextPageButton(page)

  const imgSrc = await nextPageButton.getAttribute('src', {timeout: 10_000}).catch(() => 'blankFreccia')
  return !imgSrc?.includes('blankFreccia')
}

const goNextPage = async (page: Page) => {
  const nextPageButton = retrieveNextPageButton(page)
  const responsePromise = page.waitForResponse('https://portaleclienti.edenred.it/ResponsiveLink/viewNominativeVoucherFirstLoadAction.do')
  await nextPageButton.click()
  await responsePromise
}

const retrieveBarCodes = async (page: Page) => {
  const barCodes: string[] = []

  while(true) {
    await setTimeout(5000);
    const barCode = await retrieveBarCode(page)
    console.log('Retrieved bar code', barCode)
    barCodes.push(barCode)
    if (!(await hasNextPage(page))) {
      break
    }
    await goNextPage(page)
  }

  return barCodes
}

const downloadBarCode = async (barCode: string) => {
  const barCodePrettified = barCode.replaceAll('-', '')

  const response = await fetch(`https://portaleclienti.edenred.it/ResponsiveLink/printPDFNominativiAction.do?barcode=${barCodePrettified}&save=true`)
  const destinationDirectory = join(__dirname, 'pdf')

  await mkdir(destinationDirectory, { recursive: true })
  const fileStream = createWriteStream(join(destinationDirectory, `${barCodePrettified}.pdf`));

  await pipeline(
    response.body!,
    fileStream
  )
}

const downloadBarCodes = async (barCodes: string[]) => {
  for (const barCode of barCodes) {
    console.log('Downloading bar code', barCode)
    await downloadBarCode(barCode)
  }
}

test('download all', async ({ page }) => {
  await page.goto(process.env.INITIAL_URL);

  const barCodes = await retrieveBarCodes(page)

  console.log('Retrieved bar codes')
  console.table(barCodes)
  await setTimeout(5000);

  await downloadBarCodes(barCodes)
});
