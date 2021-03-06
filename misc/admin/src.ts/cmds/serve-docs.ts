import fs from "fs";
import { createServer, Server } from "http";
import { resolve } from "path";

export function getMime(filename: string): string {
    switch (filename.split('.').pop().toLowerCase()) {
        case 'css':      return 'text/css';
        case 'doctree':  return 'application/x-doctree';
        case 'eot':      return 'application/vnd.ms-fontobject';
        case 'gif':      return 'image/gif';
        case 'html':     return 'text/html';
        case 'js':       return 'application/javascript';
        case 'jpg':      return 'image/jpeg';
        case 'jpeg':     return 'image/jpeg';
        case 'md':       return 'text/markdown';
        case 'pickle':   return 'application/x-pickle';
        case 'png':      return 'image/png';
        case 'svg':      return 'image/svg+xml';
        case 'ttf':      return 'application/x-font-ttf';
        case 'txt':      return 'text/plain';
        case 'woff':     return 'application/font-woff';
    }
    console.log('NO MIME', filename);

    return "application/octet-stream";
}

export type Options = {
    port?: number;
    redirects?: Record<string, string>;
};

export function start(root: string, options: Options): Server {
    if (root == null) { throw new Error("root required"); }
    if (options == null) { options = { }; }
    if (options.port == null) { options.port = 8000; }
    root = resolve(root);

    const server = createServer((req, resp) => {

        // Follow redirects in options
        if (options.redirects && options.redirects[req.url]) {
            resp.writeHead(301, { Location: options.redirects[req.url] });
            resp.end();
            return;
        }

        let filename = resolve(root, "." + req.url);

        // Make sure we aren't crawling out of our sandbox
        if (req.url[0] !== "/" || filename.substring(0, filename.length) !== filename) {
            resp.writeHead(403);
            resp.end();
            return;
        }

        try {
            const stat = fs.statSync(filename);
            if (stat.isDirectory()) {

                // Redirect bare directory to its path (i.e. "/foo" => "/foo/")
                if (req.url[req.url.length - 1] !== "/") {
                    resp.writeHead(301, { Location: req.url + "/" });
                    resp.end();
                    return;
                }

                filename += "/index.html";
            }

            const content = fs.readFileSync(filename);

            resp.writeHead(200, {
                "Content-Length": content.length,
                "Content-Type": getMime(filename)
            });
            resp.end(content);
            return;

        } catch (error) {
            if (error.code === "ENOENT") {
                resp.writeHead(404, { });
                resp.end();
                return;
            }

            resp.writeHead(500, { });
            resp.end();
            return;
        }
    });

    server.listen(options.port, () => {
        console.log(`Server running on: http://localhost:${ options.port }`);
    });

    return server;
}

start(resolve(__dirname, "../../docs"), {
    redirects: {
        "/": "/v5/"
    }
});

