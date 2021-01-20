'use strict';
const chromium = require('chrome-aws-lambda');

module.exports.toXpaths = async (event, context, callback) => {
    const url = event.queryStringParameters.url;
    let statusCode = 200;
    let result = "";
    console.log(url);
    if(validURL(url)) {
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

            result = await page.evaluate(e => e, jsHandle);
            await browser.close();
    } else {
        statusCode = 400;
        result = "Invalid Url";
    }


    var response = {
        "statusCode": statusCode,
        "headers": {
            'Access-Control-Allow-Origin': 'https://yasithlokuge.github.io',
            'Access-Control-Allow-Credentials': true
        },
        "body": JSON.stringify(result),
        "isBase64Encoded": false
    };
    callback(null, response);
};

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}