const swaggerCustomCSS = `
  /* Modern Dark Theme for Swagger UI */
  body, .swagger-ui {
    background-color: #0f172a !important; /* Slate 900 */
    color: #e2e8f0 !important; /* Slate 200 */
  }
  
  .swagger-ui .wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Topbar - Hide it */
  .swagger-ui .topbar { display: none; }

  /* Info Section */
  .swagger-ui .info { margin: 40px 0; }
  .swagger-ui .info .title { 
    font-size: 2.5rem; 
    color: #f8fafc !important; /* Slate 50 */
    font-weight: 800 !important;
    letter-spacing: -0.025em;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .swagger-ui .info .description { 
    color: #94a3b8 !important; /* Slate 400 */
    font-size: 1.1rem;
    margin-top: 10px;
  }
  .swagger-ui .info a { color: #38bdf8 !important; text-decoration: none; } /* Sky 400 */
  .swagger-ui .info a:hover { text-decoration: underline; }

  /* Schemes & Authorization */
  .swagger-ui .scheme-container {
    background: #1e293b !important; /* Slate 800 */
    box-shadow: none !important;
    border: 1px solid #334155;
    border-radius: 12px;
    margin: 30px 0;
    padding: 20px;
  }
  .swagger-ui .auth-wrapper .authorize {
    border-color: #3b82f6 !important;
    color: #3b82f6 !important;
    font-weight: 600;
    margin-right: 10px;
  }
  .swagger-ui .auth-wrapper .authorize svg { fill: #3b82f6 !important; }
  
  .swagger-ui .btn.authorize span { color: #3b82f6 !important; font-weight: 600; }
  .swagger-ui .btn.authorize svg { fill: #3b82f6 !important; }

  /* Operations Blocks */
  .swagger-ui .opblock {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    margin-bottom: 20px;
    overflow: hidden;
  }
  .swagger-ui .opblock:hover {
    border-color: #475569 !important;
  }
  
  .swagger-ui .opblock-tag {
    color: #f1f5f9 !important;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    border-bottom: 1px solid #334155;
    margin-bottom: 10px;
  }
  .swagger-ui .opblock-tag small {
    color: #94a3b8 !important;
  }

  /* Methods Badges */
  .swagger-ui .opblock .opblock-summary-method {
    border-radius: 6px !important;
    font-family: monospace;
    font-weight: 700 !important;
    min-width: 90px;
    text-align: center;
    text-shadow: 0 1px 0 rgba(0,0,0,0.1);
  }
  
  /* Specific Method Colors (Subtle backgrounds) */
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #10b981 !important; color: white !important; } /* Emerald 500 */
  .swagger-ui .opblock.opblock-get { background: rgba(16, 185, 129, 0.05) !important; border-color: rgba(16, 185, 129, 0.2) !important; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: rgba(16, 185, 129, 0.2) !important; }

  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #3b82f6 !important; color: white !important; } /* Blue 500 */
  .swagger-ui .opblock.opblock-post { background: rgba(59, 130, 246, 0.05) !important; border-color: rgba(59, 130, 246, 0.2) !important; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: rgba(59, 130, 246, 0.2) !important; }

  .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #f59e0b !important; color: white !important; } /* Amber 500 */
  .swagger-ui .opblock.opblock-put { background: rgba(245, 158, 11, 0.05) !important; border-color: rgba(245, 158, 11, 0.2) !important; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: rgba(245, 158, 11, 0.2) !important; }

  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #ef4444 !important; color: white !important; } /* Red 500 */
  .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.05) !important; border-color: rgba(239, 68, 68, 0.2) !important; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: rgba(239, 68, 68, 0.2) !important; }
  
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #a855f7 !important; color: white !important; } /* Purple 500 */
  .swagger-ui .opblock.opblock-patch { background: rgba(168, 85, 247, 0.05) !important; border-color: rgba(168, 85, 247, 0.2) !important; }
  .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: rgba(168, 85, 247, 0.2) !important; }

  .swagger-ui .opblock .opblock-summary-path {
    color: #e2e8f0 !important;
    font-family: 'Fira Code', monospace;
    font-size: 1.05rem;
    font-weight: 500;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: #94a3b8 !important;
  }
  .swagger-ui .opblock .opblock-summary .view-line-link {
     position: relative;
     top: 2px;
     margin: 0 5px;
     cursor: pointer;
     transition: all .5s;
  }
  
  /* Requests */
  .swagger-ui .btn { 
    border-radius: 6px !important; 
    box-shadow: none !important;
    font-weight: 600;
  }
  .swagger-ui .btn.execute {
    background-color: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: white !important;
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    letter-spacing: 0.5px;
  }
  .swagger-ui .btn.cancel {
     background-color: transparent !important;
     border: 1px solid #ef4444 !important;
     color: #ef4444 !important;
  }

  /* Expanded Section */
  .swagger-ui .opblock-body {
    background: #0f172a !important;
    border-top: 1px solid #334155;
    padding-top: 20px;
  }
  
  /* Tables and Parameters */
  .swagger-ui table thead tr th {
    color: #94a3b8 !important;
    border-bottom: 1px solid #334155 !important;
    font-family: 'Inter', sans-serif;
    padding: 12px 0;
  }
  .swagger-ui table tbody tr td {
    padding: 12px 0;
    border-bottom: 1px solid #334155 !important;
    color: #e2e8f0 !important;
  }
  
  .swagger-ui .parameter__name { 
    color: #f8fafc !important;
    font-weight: 600;
  }
  .swagger-ui .parameter__type { 
    color: #38bdf8 !important;
    font-family: monospace;
    font-size: 0.9em;
  }
  .swagger-ui .parameter__in { 
    color: #94a3b8 !important; 
    font-style: italic;
    font-size: 0.9em;
  }
  
  .swagger-ui .tab li { color: #94a3b8 !important; }
  .swagger-ui .tab li.active { color: #e2e8f0 !important; border-bottom: 2px solid #38bdf8; }

  /* Models */
  .swagger-ui section.models {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 12px;
    margin-top: 30px;
  }
  .swagger-ui section.models h4 {
    color: #e2e8f0 !important;
    border-bottom: 1px solid #334155 !important;
    padding: 15px 20px;
    font-size: 1.2rem;
  }
  .swagger-ui .models .model-container {
    background: #1e293b !important; 
  }
  .swagger-ui .model-box {
    background: transparent !important;
  }
  .swagger-ui .model {
    color: #e2e8f0 !important;
  }
  .swagger-ui .model-title {
    color: #f1f5f9 !important;
  }
  .swagger-ui .prop-type {
    color: #f472b6 !important; /* Pink 400 */
  }
  .swagger-ui .prop-format {
     color: #fb923c !important; /* Orange 400 */
  }
  .swagger-ui .model .property.primitive {
     color: #94a3b8 !important;
  }

  /* Inputs and Selects */
  .swagger-ui input[type=text], .swagger-ui input[type=email], .swagger-ui input[type=password], .swagger-ui textarea, .swagger-ui select {
    background: #0f172a !important;
    border: 1px solid #475569 !important;
    color: #e2e8f0 !important;
    border-radius: 6px;
    padding: 8px 12px;
  }
  .swagger-ui input:focus, .swagger-ui textarea:focus, .swagger-ui select:focus {
    border-color: #38bdf8 !important;
    outline: none;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
  }

  /* Try it out button */
  .swagger-ui .btn.try-out__btn {
    border-color: #475569 !important;
    color: #e2e8f0 !important;
    background: #1e293b !important;
    padding: 6px 16px;
  } 
  .swagger-ui .btn.try-out__btn:hover {
    border-color: #94a3b8 !important;
  }

  /* JSON Output */
  .swagger-ui .highlight-code pre {
    background: #0f172a !important;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
  }
  .swagger-ui .microlight {
    color: #e2e8f0 !important;
  }
`;

const swaggerOptions = {
  customCss: swaggerCustomCSS,
  customSiteTitle: 'NFC Access Control API Docs',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    syntaxHighlight: {
      theme: 'obsidian' // Use a built-in dark theme for code blocks if possible, or fallback to our CSS
    }
  },
};

module.exports = swaggerOptions;
