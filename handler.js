'use strict';
const chromium = require('chrome-aws-lambda');
const request = require('request');

module.exports.toXpaths = async (event, context, callback) => {
    let statusCode = 200;
    let result = "";
    const data = JSON.parse(event.body);
    const url = data.url;
    const token = data.token;
    console.log(url);
    const reCaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`;
    console.log(reCaptchaUrl);
    console.log(process.env.ORIGIN);
    const options = {
        'method': 'GET',
        'url': reCaptchaUrl,
        'headers': {}
    };

    return await new Promise((resolve, reject) => {

        request(options, async function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            const gResponse = JSON.parse(response.body);
            console.log(gResponse.success);
            if (gResponse.success) {
                if (validURL(url) && token) {
                    console.log("valid url and token");
                    const browser = await chromium.puppeteer.launch({
                        args: chromium.args,
                        defaultViewport: chromium.defaultViewport,
                        executablePath: await chromium.executablePath,
                        headless: chromium.headless,
                        ignoreHTTPSErrors: true,
                    });

                    const page = await browser.newPage();
                    await page.goto(url);

                    await page.addScriptTag({path: "html-to-xpaths.js"});
                    const jsHandle = await page.evaluateHandle(() => {
                        return htmlElementToXpaths(document.documentElement);
                    });

                    result = await page.evaluate(e => e, jsHandle);
                    await browser.close();

                } else {
                    console.log("invalid url and token");
                    statusCode = 400;
                    result = "Invalid request";
                }
            } else {
                console.log("Verification failed");
                statusCode = 400;
                result = "Verification failed";
            }

            resolve({
                statusCode: statusCode,
                headers: {
                    'Access-Control-Allow-Origin': process.env.ORIGIN,
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify(result),
                isBase64Encoded: false
            });

            //callback(null, callbackResponse);

        });

    });
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