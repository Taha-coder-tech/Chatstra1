const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');

// Initialize i18next
i18next
    .use(Backend) // For loading translation files from the filesystem
    .use(middleware.LanguageDetector) // For detecting the user's language
    .init({
        fallbackLng: 'en', // Default language
        backend: {
            loadPath: './locales/{{lng}}/translation.json', // Path to your language files
        },
        detection: {
            // Options for language detection
            order: ['querystring', 'cookie', 'header', 'session', 'navigator', 'path', 'subdomain'],
            caches: ['cookie'], // Cache the detected language in a cookie
        },
        debug: false, // Set to true for debugging
    });

    // Middleware to handle localization
    const localizationMiddleware = (req, res, next) => {
        const lng = req.i18n.language; // Get the detected language
        req.i18n.changeLanguage(lng); // Change the language for the request
        next(); // Proceed to the next middleware
        };    
    
// Export the middleware to be used in your app
module.exports = middleware.handle(i18next);
