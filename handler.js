'use strict';
const chromium = require('chrome-aws-lambda');

module.exports.toXpaths = async (event, context, callback) => {
    const url = event.queryStringParameters.url;
    const browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url);

    await page.addScriptTag({ path :"html-to-xpaths.js"});
    const jsHandle = await page.evaluateHandle(() => {
        return htmlElementToXpaths(document.documentElement);
    });

    const result = await page.evaluate(e => e, jsHandle);
    await browser.close();

    var response = {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': 'https://yasithlokuge.github.io',
            'Access-Control-Allow-Credentials': true
        },
        "body": JSON.stringify(result),
        "isBase64Encoded": false
    };
    callback(null, response);
};