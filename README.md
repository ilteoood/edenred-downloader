# Edenred downloader

A simple PDF downloader for [Edenred Ticket Compliments](https://portaleclienti.edenred.it/).

![screenshot of the Edenred Ticket Compliments website](image.png)

## Usage

Change the content of the `.env` file and define the `INITIAL_URL` variable. Its value must be the public URL received by Edenred by e-mail.

Next, run the `test` script. It will download the PDF files and save them in the `src/pdf` folder.