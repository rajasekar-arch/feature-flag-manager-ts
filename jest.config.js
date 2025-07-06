/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Add reporter configuration here
  reporters: [
    "default", // Keep the default console output
    ["jest-junit", { outputDirectory: "test-results", outputName: "junit.xml" }], // For CI/CD tools
    ["jest-html-reporters", {
        "publicPath": "./html-report",
        "filename": "report.html",
        "expand": true
    }]
  ],
  // If you want a JSON output of the results
  // jest-junit requires a separate installation
  // "coverageReporters": ["json", "lcov", "text", "clover"] // Example for coverage reports
};