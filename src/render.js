const path = require("path");
const puppeteer = require("puppeteer");
const logger = require("./logger.js");
const runSandboxScript = require("./run-sandbox-script.js");

const renderPdf = async ({
  mainMdFilename,
  pathToStatic,
  pathToPublic,
  pdfOptions,
  docsifyRendererPort,
  emulateMedia,
}) => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1200,
      height: 1000,
    },
  });
  try {
    const mainMdFilenameWithoutExt = path.parse(mainMdFilename).name;
    const docsifyUrl = `http://localhost:${docsifyRendererPort}/#/${pathToStatic}/${mainMdFilenameWithoutExt}`;

    const page = await browser.newPage();
    await page.goto(docsifyUrl, { waitUntil: "networkidle0" });

    const renderProcessingErrors = await runSandboxScript(page, {
      mainMdFilenameWithoutExt,
      pathToStatic,
    });

    if (renderProcessingErrors.length)
      logger.warn("anchors processing errors", renderProcessingErrors);

    await page.emulateMedia(emulateMedia);
    await page.pdf({
      ...pdfOptions,
      headerTemplate: '<div style="display: none"></div>',
      footerTemplate: '<p style="margin: auto;text-align: center;font-size: 8px;"><span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span></p>',
      displayHeaderFooter: true,
      path: path.resolve(pathToPublic),
      margin: { left: '1cm', right: '1cm', top: '1cm', bottom: 70 }
    });

    return await browser.close();
  } catch (e) {
    await browser.close();
    throw e;
  }
};

const htmlToPdf = ({
  mainMdFilename,
  pathToStatic,
  pathToPublic,
  pdfOptions,
  removeTemp,
  docsifyRendererPort,
  emulateMedia,
}) => async () => {
  const { closeProcess } = require("./utils.js")({ pathToStatic, removeTemp });
  try {
    return await renderPdf({
      mainMdFilename,
      pathToStatic,
      pathToPublic,
      pdfOptions,
      docsifyRendererPort,
      emulateMedia,
    });
  } catch (err) {
    logger.err("puppeteer renderer error:", err);
    await closeProcess(1);
  }
};

module.exports = config => ({
  htmlToPdf: htmlToPdf(config),
});
