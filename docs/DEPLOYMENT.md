# Deployment

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. In the GitHub
repository settings:

1. Open **Pages**.
2. Choose **GitHub Actions** as the source.
3. Push to `main` or manually run the workflow.

The workflow builds with `/<repository-name>/` as the Angular base path and
adds `404.html` for client-side routing.

## Direct FTPS from Campaign Manager

GitHub Actions is optional. Open **Preview & publish** in Campaign Manager and
enter the host, port, remote folder, username and password supplied by your web
host. Choose **FTPS** whenever the host supports it, save the destination and
use **Test connection** before the first release.

**Build & publish now** performs a fresh production build and uploads the
generated browser files to the chosen remote folder. It overwrites matching
files but does not delete unrelated remote files. The password is stored only
in the protected QuestKeeper configuration root, which is outside Git and never
returned to the browser after saving.

Plain FTP is also available for legacy hosts, but it sends both credentials
and site files without encryption. QuestKeeper displays a warning and requires
an explicit acknowledgement for every test or upload. Prefer FTPS or your
host's HTTPS/SFTP tooling whenever possible.

## Apache

Build with the path where the app will live:

```bash
npm ci
npm run build -- --base-href /campaigns/
```

Upload `dist/campaign-companion/browser/` to that directory and enable
`mod_rewrite`. Place this `.htaccess` beside `index.html`:

```apache
RewriteEngine On
RewriteBase /campaigns/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . index.html [L]
```

Use `/` for both values when deploying at the domain root.

## Nginx

```nginx
location /campaigns/ {
    alias /var/www/campaign-companion/;
    try_files $uri $uri/ /campaigns/index.html;
}
```

For a root deployment, use `root /var/www/campaign-companion;` and
`try_files $uri $uri/ /index.html;`.

## Updating

Campaign Companion is static. Rebuild and replace the generated folder after
changing JSON, images or code. Do not upload source `.env` files,
transcripts, Git metadata or `node_modules`.
