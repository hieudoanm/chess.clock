lint:
	pnpm web-ext lint --source-dir ./dist

build:
	pnpm web-ext build --source-dir ./dist --artifacts-dir ./download

sign:
	@read -p "Enter WEB_EXT_API_KEY (JWT issuer): " API_KEY; \
	read -p "Enter WEB_EXT_API_SECRET (JWT secret): " API_SECRET; \
	WEB_EXT_API_KEY="$$API_KEY" WEB_EXT_API_SECRET="$$API_SECRET" \
	pnpm web-ext sign --source-dir ./dist --artifacts-dir ./download --channel unlisted
