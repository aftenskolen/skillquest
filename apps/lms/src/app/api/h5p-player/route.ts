import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get("base") ?? "";

  // Kun tillat https:// URLer for å unngå XSS
  if (!base.startsWith("https://")) {
    return new NextResponse("Ugyldig base-URL", { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>H5P</title>
  <link rel="stylesheet" href="/h5p/styles/h5p.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    #h5p-container { width: 100%; }
  </style>
</head>
<body>
  <div id="h5p-container"></div>
  <script>
    (function () {
      var base = ${JSON.stringify(base)};
      var script = document.createElement('script');
      script.src = '/h5p/main.bundle.js';
      script.onload = async function () {
        try {
          var el = document.getElementById('h5p-container');
          await new H5PStandalone.H5P(el, {
            h5pJsonPath: base,
            frameJs: '/h5p/frame.bundle.js',
            frameCss: '/h5p/styles/h5p.css',
          });
          // Forward xAPI events to parent page
          if (window.H5P && window.H5P.externalDispatcher) {
            window.H5P.externalDispatcher.on('xAPI', function (event) {
              var stmt = event && event.data && event.data.statement;
              if (!stmt) return;
              window.parent.postMessage({ type: 'h5p-xapi', statement: stmt }, '*');
            });
          }
        } catch (err) {
          document.body.innerHTML = '<p style="padding:16px;color:#c00;font-family:sans-serif">Kunne ikke laste H5P-innhold: ' + err.message + '</p>';
        }
      };
      script.onerror = function () {
        document.body.innerHTML = '<p style="padding:16px;color:#c00;font-family:sans-serif">Kunne ikke laste H5P-biblioteket (nettverksfeil).</p>';
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
